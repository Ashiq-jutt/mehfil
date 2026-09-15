using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Users;

public sealed class AccountService(MehfilDbContext db, IClock clock, ILogger<AccountService> logger) : IAccountService
{
    public async Task DeleteAsync(long userId, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw NotFoundException.For("User", userId);
        if (user.Status == UserStatus.Deleted)
        {
            return;
        }

        var now = clock.UtcNow;
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);

            user.Status = UserStatus.Deleted;
            user.DeletedAt = now;
            user.DisplayName = "Deleted user";
            user.Email = $"deleted-{user.Id}@mehfil.invalid";
            user.GoogleSubject = $"deleted:{user.Id}:{Guid.NewGuid():N}";
            user.AvatarUrl = null;
            user.Signature = null;
            user.IsOnline = false;
            await db.SaveChangesAsync(ct);

            await db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now), ct);
            await db.DeviceTokens.Where(t => t.UserId == userId).ExecuteDeleteAsync(ct);
            await db.Clubs.Where(c => c.OwnerId == userId && c.IsActive)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.IsActive, false), ct);
            await db.ClubSeats.Where(s => s.UserId == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.UserId, (long?)null).SetProperty(x => x.TakenAt, (DateTimeOffset?)null), ct);

            await tx.CommitAsync(ct);
        });

        logger.LogInformation("User {UserId} deleted their account", userId);
    }
}
