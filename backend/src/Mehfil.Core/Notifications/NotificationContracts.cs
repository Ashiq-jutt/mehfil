using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Notifications;

public sealed record NotificationDto(long Id, NotificationType Type, string Title, string Body, string? DataJson, bool IsRead, DateTimeOffset CreatedAt);

public sealed record NotificationListDto(PagedResult<NotificationDto> Notifications, int UnreadCount);

public sealed record NotificationSettingsDto(bool PushGifts, bool PushFollows, bool PushRewards, bool PushSystem);

public sealed record UpdateNotificationSettingsRequest(bool PushGifts, bool PushFollows, bool PushRewards, bool PushSystem);

public sealed record RegisterDeviceRequest(DevicePlatform Platform, string Token);

public sealed record UnregisterDeviceRequest(string Token);

public interface INotificationService
{
    Task<NotificationListDto> ListAsync(long userId, int? page, int? pageSize, CancellationToken ct);
    Task<int> MarkReadAsync(long userId, long notificationId, CancellationToken ct);
    Task<int> MarkAllReadAsync(long userId, CancellationToken ct);

    /// <summary>Stores a notification row and, when the user's settings allow it, pushes it to their devices. Never throws for push failures.</summary>
    Task NotifyAsync(long userId, NotificationType type, string title, string body, IReadOnlyDictionary<string, string>? data, CancellationToken ct);

    Task<NotificationSettingsDto> GetSettingsAsync(long userId, CancellationToken ct);
    Task<NotificationSettingsDto> UpdateSettingsAsync(long userId, UpdateNotificationSettingsRequest request, CancellationToken ct);

    Task RegisterDeviceAsync(long userId, RegisterDeviceRequest request, CancellationToken ct);
    Task UnregisterDeviceAsync(long userId, string token, CancellationToken ct);
}

/// <summary>Transport for push messages (FCM in production). Returns the tokens the provider reports as dead.</summary>
public interface IPushSender
{
    bool IsConfigured { get; }
    Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<string> tokens, string title, string body, IReadOnlyDictionary<string, string> data, CancellationToken ct);
}

public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";

    /// <summary>Path to a service-account JSON file. Server-side only; never committed.</summary>
    public string? CredentialsPath { get; set; }

    /// <summary>Alternative to the path: the service-account JSON itself (e.g. from a secret store).</summary>
    public string? CredentialsJson { get; set; }
}

/// <summary>Which setting gates each notification type (pure).</summary>
public static class NotificationCategories
{
    public static bool Allows(NotificationType type, NotificationSettingsDto settings) => type switch
    {
        NotificationType.GiftReceived => settings.PushGifts,
        NotificationType.ClubFollowed => settings.PushFollows,
        NotificationType.LeaderboardReward => settings.PushRewards,
        _ => settings.PushSystem,
    };
}
