using System.Text.Json;
using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Notifications;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Notifications;

public sealed class NotificationService(MehfilDbContext db, IPushSender push, IClock clock, ILogger<NotificationService> logger) : INotificationService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 50;

    public async Task<NotificationListDto> ListAsync(long userId, int? page, int? pageSize, CancellationToken ct)
    {
        var p = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);
        var query = db.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        var total = await query.LongCountAsync(ct);
        var unread = await query.CountAsync(n => !n.IsRead, ct);
        var items = await query.OrderByDescending(n => n.Id).Skip((p - 1) * size).Take(size)
            .Select(n => new NotificationDto(n.Id, n.Type, n.Title, n.Body, n.DataJson, n.IsRead, n.CreatedAt))
            .ToListAsync(ct);
        return new NotificationListDto(new PagedResult<NotificationDto>(items, p, size, total), unread);
    }

    public async Task<int> MarkReadAsync(long userId, long notificationId, CancellationToken ct)
    {
        var changed = await db.Notifications.Where(n => n.Id == notificationId && n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        if (changed == 0 && !await db.Notifications.AnyAsync(n => n.Id == notificationId && n.UserId == userId, ct))
        {
            throw NotFoundException.For("Notification", notificationId);
        }

        return await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);
    }

    public async Task<int> MarkAllReadAsync(long userId, CancellationToken ct)
    {
        await db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        return 0;
    }

    public async Task NotifyAsync(long userId, NotificationType type, string title, string body, IReadOnlyDictionary<string, string>? data, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => new { u.Status, Settings = new NotificationSettingsDto(u.PushGifts, u.PushFollows, u.PushRewards, u.PushSystem) })
            .FirstOrDefaultAsync(ct);
        if (user is null || user.Status != UserStatus.Active)
        {
            return;
        }

        var payload = new Dictionary<string, string>(data ?? new Dictionary<string, string>()) { ["type"] = type.ToString() };
        var row = new Notification
        {
            UserId = userId,
            Type = type,
            Title = Truncate(title, 120),
            Body = Truncate(body, 500),
            DataJson = JsonSerializer.Serialize(payload),
            CreatedAt = clock.UtcNow,
        };
        db.Notifications.Add(row);
        await db.SaveChangesAsync(ct);

        if (!push.IsConfigured || !NotificationCategories.Allows(type, user.Settings))
        {
            return;
        }

        var tokens = await db.DeviceTokens.AsNoTracking().Where(t => t.UserId == userId).Select(t => t.FcmToken).ToListAsync(ct);
        if (tokens.Count == 0)
        {
            return;
        }

        payload["notificationId"] = row.Id.ToString();
        try
        {
            var dead = await push.SendAsync(tokens, row.Title, row.Body, payload, ct);
            if (dead.Count > 0)
            {
                await db.DeviceTokens.Where(t => dead.Contains(t.FcmToken)).ExecuteDeleteAsync(ct);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Push delivery failed for user {UserId}", userId);
        }
    }

    public async Task<NotificationSettingsDto> GetSettingsAsync(long userId, CancellationToken ct) =>
        await db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => new NotificationSettingsDto(u.PushGifts, u.PushFollows, u.PushRewards, u.PushSystem))
            .FirstOrDefaultAsync(ct) ?? throw NotFoundException.For("User", userId);

    public async Task<NotificationSettingsDto> UpdateSettingsAsync(long userId, UpdateNotificationSettingsRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw NotFoundException.For("User", userId);
        user.PushGifts = request.PushGifts;
        user.PushFollows = request.PushFollows;
        user.PushRewards = request.PushRewards;
        user.PushSystem = request.PushSystem;
        await db.SaveChangesAsync(ct);
        return new NotificationSettingsDto(user.PushGifts, user.PushFollows, user.PushRewards, user.PushSystem);
    }

    public async Task RegisterDeviceAsync(long userId, RegisterDeviceRequest request, CancellationToken ct)
    {
        var token = request.Token.Trim();
        var now = clock.UtcNow;
        var existing = await db.DeviceTokens.FirstOrDefaultAsync(t => t.FcmToken == token, ct);
        if (existing is null)
        {
            db.DeviceTokens.Add(new DeviceToken { UserId = userId, Platform = request.Platform, FcmToken = token, UpdatedAt = now });
        }
        else
        {
            // A device that signed into another account moves with it.
            existing.UserId = userId;
            existing.Platform = request.Platform;
            existing.UpdatedAt = now;
        }

        await db.SaveChangesAsync(ct);
    }

    public Task UnregisterDeviceAsync(long userId, string token, CancellationToken ct) =>
        db.DeviceTokens.Where(t => t.UserId == userId && t.FcmToken == token.Trim()).ExecuteDeleteAsync(ct);

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];
}
