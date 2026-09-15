using Mehfil.Core.Common;
using Mehfil.Core.Economy;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Rooms;
using Mehfil.Infrastructure.Data;
using Mehfil.Infrastructure.Leaderboards;
using Mehfil.Infrastructure.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Economy;

public sealed class GiftService(
    MehfilDbContext db,
    RoomRegistry registry,
    IRoomNotifier notifier,
    LeaderboardVersion leaderboardVersion,
    IClock clock,
    ILogger<GiftService> logger) : IGiftService
{
    public const int MaxQuantity = 999;

    public async Task<IReadOnlyList<GiftDto>> GetCatalogAsync(CancellationToken ct) =>
        await db.Gifts.AsNoTracking().Where(g => g.IsActive).OrderBy(g => g.SortOrder)
            .Select(g => new GiftDto(g.Code, g.Name, g.IconUrl, g.AnimationUrl, g.HeartsPrice))
            .ToListAsync(ct);

    public async Task<ClubLevelDto> GetClubLevelAsync(string clubPublicId, CancellationToken ct)
    {
        var club = await db.Clubs.FirstOrDefaultAsync(c => c.PublicId == clubPublicId.Trim() && c.IsActive, ct)
                   ?? throw NotFoundException.For("Club", clubPublicId);
        if (ResetJarIfDue(club))
        {
            await db.SaveChangesAsync(ct);
        }

        return ToLevel(club);
    }

    public async Task<SendGiftResultDto> SendAsync(long senderId, string clubPublicId, SendGiftRequest request, CancellationToken ct)
    {
        if (request.Quantity is < 1 or > MaxQuantity)
        {
            throw new BadRequestException("gifts.invalid_quantity", $"Quantity must be between 1 and {MaxQuantity}.");
        }

        var club = await db.Clubs.FirstOrDefaultAsync(c => c.PublicId == clubPublicId.Trim() && c.IsActive, ct)
                   ?? throw NotFoundException.For("Club", clubPublicId);
        if (registry.GetUserRoom(senderId) != club.Id)
        {
            throw new BadRequestException("room.not_in_room", "Join the club room first.");
        }

        var gift = await db.Gifts.AsNoTracking().FirstOrDefaultAsync(g => g.Code == request.GiftCode && g.IsActive, ct)
                   ?? throw NotFoundException.For("Gift", request.GiftCode);

        User? receiver = null;
        if (!string.IsNullOrWhiteSpace(request.ReceiverId))
        {
            var upper = request.ReceiverId.Trim().ToUpperInvariant();
            receiver = await db.Users.FirstOrDefaultAsync(u => u.PublicId == upper, ct) ?? throw NotFoundException.For("User", request.ReceiverId);
            if (receiver.Id == senderId)
            {
                throw new BadRequestException("gifts.self", "You cannot send a gift to yourself.");
            }

            if (registry.GetUserRoom(receiver.Id) != club.Id)
            {
                throw new BadRequestException("gifts.receiver_not_in_room", "That user is not in this room.");
            }
        }

        var hearts = gift.HeartsPrice * request.Quantity;
        var now = clock.UtcNow;
        var strategy = db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);

            // Atomic debit: succeeds only when the balance still covers the cost.
            var debited = await db.Users
                .Where(u => u.Id == senderId && u.HeartsBalance >= hearts)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(u => u.HeartsBalance, u => u.HeartsBalance - hearts)
                    .SetProperty(u => u.HeartsGifted, u => u.HeartsGifted + hearts), ct);
            if (debited == 0)
            {
                throw new ConflictException("gifts.insufficient_hearts", "Not enough hearts. Top up in the Shop.");
            }

            var balance = await db.Users.Where(u => u.Id == senderId).Select(u => u.HeartsBalance).FirstAsync(ct);

            var transaction = new GiftTransaction
            {
                ClubId = club.Id,
                SenderId = senderId,
                ReceiverId = receiver?.Id,
                GiftId = gift.Id,
                Quantity = request.Quantity,
                Hearts = hearts,
                CreatedAt = now,
            };
            db.GiftTransactions.Add(transaction);
            await db.SaveChangesAsync(ct);

            db.WalletLedger.Add(new WalletLedger
            {
                UserId = senderId,
                Delta = -hearts,
                BalanceAfter = balance,
                Reason = LedgerReason.GiftSent,
                ReferenceId = transaction.Id,
                Note = $"{gift.Name} ×{request.Quantity}" + (receiver is null ? "" : $" → {receiver.DisplayName}"),
                CreatedAt = now,
            });

            if (receiver is not null)
            {
                await db.Users.Where(u => u.Id == receiver.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.HeartsReceived, u => u.HeartsReceived + hearts), ct);
            }

            ResetJarIfDue(club);
            var (level, jar, jars, jarsNext, leveledUp) = ClubLevels.Apply(club.Level, club.JarHearts, club.JarsCollected, club.JarsForNextLevel, club.JarTarget, hearts);
            club.Level = level;
            club.JarHearts = jar;
            club.JarsCollected = jars;
            club.JarsForNextLevel = jarsNext;
            club.TotalHearts += hearts;

            var senderName = await db.Users.Where(u => u.Id == senderId).Select(u => u.DisplayName).FirstAsync(ct);
            var text = $"{senderName} sent {gift.Name} ×{request.Quantity}" + (receiver is null ? " to the club" : $" to {receiver.DisplayName}");
            var message = new ClubMessage { ClubId = club.Id, SenderId = senderId, Type = MessageType.Gift, Text = text, GiftTransactionId = transaction.Id, CreatedAt = now };
            db.ClubMessages.Add(message);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            leaderboardVersion.Bump();

            var users = await LoadRoomUsersAsync(club.Id, receiver is null ? [senderId] : [senderId, receiver.Id], ct);
            var evt = new GiftEventDto(
                transaction.Id,
                users[senderId],
                receiver is null ? null : users.GetValueOrDefault(receiver.Id),
                new GiftDto(gift.Code, gift.Name, gift.IconUrl, gift.AnimationUrl, gift.HeartsPrice),
                request.Quantity,
                hearts,
                ToLevel(club),
                leveledUp,
                now);

            await notifier.MessageReceivedAsync(club.Id, new ClubMessageDto(message.Id, message.Type, message.Text, users[senderId], now, transaction.Id));
            await notifier.GiftReceivedAsync(club.Id, evt);
            if (leveledUp)
            {
                logger.LogInformation("Club {ClubId} reached level {Level}", club.PublicId, club.Level);
            }

            return new SendGiftResultDto(evt, balance);
        });
    }

    // ------------------------------------------------------------------

    private bool ResetJarIfDue(Club club)
    {
        var now = clock.UtcNow;
        if (now < club.JarResetsAt)
        {
            return false;
        }

        club.JarHearts = 0;
        club.JarResetsAt = ClubServiceJar.NextReset(now);
        return true;
    }

    private static ClubLevelDto ToLevel(Club club) =>
        new(club.Level, club.JarHearts, club.JarTarget, club.JarResetsAt, club.JarsCollected, club.JarsForNextLevel, club.TotalHearts);

    private async Task<Dictionary<long, RoomUserDto>> LoadRoomUsersAsync(long clubId, long[] ids, CancellationToken ct)
    {
        var rows = await db.Users.AsNoTracking().Where(u => ids.Contains(u.Id))
            .Select(u => new
            {
                u.Id, u.PublicId, u.DisplayName, u.AvatarUrl, u.Level, u.Gender, u.RoyalLevel,
                Role = db.ClubMembers.Where(m => m.ClubId == clubId && m.UserId == u.Id).Select(m => (ClubRole?)m.Role).FirstOrDefault(),
            }).ToListAsync(ct);
        return rows.ToDictionary(r => r.Id, r =>
        {
            var (mic, speaking) = registry.GetState(r.Id);
            return new RoomUserDto(r.PublicId, r.DisplayName, r.AvatarUrl, r.Level, r.Role ?? ClubRole.Member, r.Gender, r.RoyalLevel, mic, speaking);
        });
    }
}

internal static class ClubServiceJar
{
    public static DateTimeOffset NextReset(DateTimeOffset now) => Clubs.ClubService.NextJarReset(now);
}
