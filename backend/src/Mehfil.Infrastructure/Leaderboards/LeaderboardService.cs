using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Leaderboards;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Leaderboards;

/// <summary>
/// Live rankings are aggregated from GiftTransactions (cached briefly). Finished periods are frozen lazily into
/// LeaderboardSnapshots on first request after the period ends, granting rewards and achievements in the same step.
/// </summary>
public sealed class LeaderboardService(
    MehfilDbContext db,
    IMemoryCache cache,
    LeaderboardVersion version,
    IClock clock,
    ILogger<LeaderboardService> logger) : ILeaderboardService
{
    private const int LiveSize = 50;
    private static readonly TimeSpan LiveTtl = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan FrozenTtl = TimeSpan.FromMinutes(5);

    /// <summary>Serialises finalisation inside one process; the unique snapshot index guards across processes.</summary>
    private static readonly SemaphoreSlim FinalizeLock = new(1, 1);

    public async Task<LeaderboardDto> GetAsync(long userId, LeaderboardBoard board, LeaderboardPeriod period, CancellationToken ct)
    {
        var now = clock.UtcNow;
        var previous = await GetPreviousAsync(board, period, now, ct);
        var current = await GetCurrentAsync(board, period, now, ct);
        var me = await GetMeAsync(userId, board, period, now, ct);
        return new LeaderboardDto(board, period, previous, current, me);
    }

    public async Task<LeaderboardRewardsDto> GetRewardsAsync(CancellationToken ct)
    {
        var items = await db.StoreItems.AsNoTracking()
            .Where(i => i.IsActive && i.UnlockRule == UnlockRule.Leaderboard && i.UnlockBoard != null)
            .OrderBy(i => i.UnlockValue).ThenBy(i => i.Kind).ThenBy(i => i.SortOrder)
            .ToListAsync(ct);

        var boards = Enum.GetValues<LeaderboardBoard>()
            .Select(board => new BoardRewardsDto(
                board,
                Enumerable.Range(1, LeaderboardPeriods.RewardedRanks)
                    .Select(rank => new RewardRankDto(
                        rank,
                        items.Where(i => i.UnlockBoard == board && i.UnlockValue == rank)
                            .Select(i => new RewardItemDto(i.Code, i.Kind, i.Name, i.AssetUrl, i.PreviewUrl))
                            .ToList()))
                    .ToList()))
            .ToList();

        return new LeaderboardRewardsDto(boards);
    }

    // ---- current (live) ------------------------------------------------------

    private async Task<LeaderboardPeriodDto> GetCurrentAsync(LeaderboardBoard board, LeaderboardPeriod period, DateTimeOffset now, CancellationToken ct)
    {
        var (start, end) = LeaderboardPeriods.Current(period, now);
        var key = $"lb:live:{board}:{period}:{start:yyyyMMdd}:{version.Value}";
        if (cache.TryGetValue(key, out LeaderboardPeriodDto? cached) && cached is not null)
        {
            return cached;
        }

        var scores = Scores(board, start, end);
        var top = await scores.OrderByDescending(s => s.Score).ThenBy(s => s.Id).Take(LiveSize).ToListAsync(ct);
        var total = await scores.SumAsync(s => (long?)s.Score, ct) ?? 0;
        var entries = await HydrateAsync(board, top, ct);
        var dto = new LeaderboardPeriodDto(LeaderboardPeriods.CurrentLabel(period), start, end, total, entries);
        cache.Set(key, dto, LiveTtl);
        return dto;
    }

    private async Task<LeaderboardEntryDto?> GetMeAsync(long userId, LeaderboardBoard board, LeaderboardPeriod period, DateTimeOffset now, CancellationToken ct)
    {
        long? subjectId = board == LeaderboardBoard.TopClubs
            ? await db.Clubs.AsNoTracking().Where(c => c.OwnerId == userId && c.IsActive).Select(c => (long?)c.Id).FirstOrDefaultAsync(ct)
            : userId;
        if (subjectId is null)
        {
            return null;
        }

        var (start, end) = LeaderboardPeriods.Current(period, now);
        var scores = Scores(board, start, end);
        var mine = await scores.Where(s => s.Id == subjectId.Value).Select(s => (long?)s.Score).FirstOrDefaultAsync(ct) ?? 0;
        var ahead = await scores.CountAsync(s => s.Score > mine, ct);
        var rows = await HydrateAsync(board, [new ScoreRow { Id = subjectId.Value, Score = mine }], ct);
        return rows.Count == 0 ? null : rows[0] with { Rank = ahead + 1 };
    }

    // ---- previous (frozen) ---------------------------------------------------

    private async Task<LeaderboardPeriodDto> GetPreviousAsync(LeaderboardBoard board, LeaderboardPeriod period, DateTimeOffset now, CancellationToken ct)
    {
        var (start, end) = LeaderboardPeriods.Previous(period, now);
        var periodStart = DateOnly.FromDateTime(start.UtcDateTime);
        var key = $"lb:frozen:{board}:{period}:{periodStart:yyyyMMdd}";
        if (cache.TryGetValue(key, out LeaderboardPeriodDto? cached) && cached is not null)
        {
            return cached;
        }

        var rows = await LoadSnapshotAsync(board, period, periodStart, ct);
        if (rows.Count == 0)
        {
            await FinalizeAsync(board, period, periodStart, start, end, ct);
            rows = await LoadSnapshotAsync(board, period, periodStart, ct);
        }

        // Rank 0 is the "period closed" marker whose Score holds the period total.
        var total = rows.FirstOrDefault(r => r.Rank == 0)?.Score ?? 0;
        var ranked = rows.Where(r => r.Rank > 0).OrderBy(r => r.Rank).Select(r => new ScoreRow { Id = r.SubjectId, Score = r.Score }).ToList();
        var entries = await HydrateAsync(board, ranked, ct);
        var dto = new LeaderboardPeriodDto(LeaderboardPeriods.PreviousLabel(period), start, end, total, entries);
        cache.Set(key, dto, FrozenTtl);
        return dto;
    }

    private Task<List<LeaderboardSnapshot>> LoadSnapshotAsync(LeaderboardBoard board, LeaderboardPeriod period, DateOnly periodStart, CancellationToken ct) =>
        db.LeaderboardSnapshots.AsNoTracking()
            .Where(s => s.Board == board && s.Period == period && s.PeriodStart == periodStart)
            .ToListAsync(ct);

    private async Task FinalizeAsync(LeaderboardBoard board, LeaderboardPeriod period, DateOnly periodStart, DateTimeOffset start, DateTimeOffset end, CancellationToken ct)
    {
        await FinalizeLock.WaitAsync(ct);
        try
        {
            if (await db.LeaderboardSnapshots.AnyAsync(s => s.Board == board && s.Period == period && s.PeriodStart == periodStart, ct))
            {
                return;
            }

            var scores = Scores(board, start, end);
            var top = await scores.OrderByDescending(s => s.Score).ThenBy(s => s.Id).Take(LeaderboardPeriods.SnapshotSize).ToListAsync(ct);
            var total = await scores.SumAsync(s => (long?)s.Score, ct) ?? 0;
            var rewards = await db.StoreItems.AsNoTracking()
                .Where(i => i.IsActive && i.UnlockRule == UnlockRule.Leaderboard && i.UnlockBoard == board && i.UnlockValue <= LeaderboardPeriods.RewardedRanks)
                .ToListAsync(ct);

            var now = clock.UtcNow;
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync(ct);

                db.LeaderboardSnapshots.Add(new LeaderboardSnapshot
                {
                    Board = board, Period = period, PeriodStart = periodStart, Rank = 0, SubjectId = 0, Score = total, CreatedAt = now,
                });

                for (var i = 0; i < top.Count; i++)
                {
                    var rank = i + 1;
                    var rankRewards = rewards.Where(r => r.UnlockValue == rank).ToList();
                    db.LeaderboardSnapshots.Add(new LeaderboardSnapshot
                    {
                        Board = board,
                        Period = period,
                        PeriodStart = periodStart,
                        Rank = rank,
                        SubjectId = top[i].Id,
                        Score = top[i].Score,
                        RewardItemId = rankRewards.FirstOrDefault()?.Id,
                        CreatedAt = now,
                    });

                    if (rank <= LeaderboardPeriods.RewardedRanks)
                    {
                        await GrantAsync(board, period, rank, top[i].Id, rankRewards, now, ct);
                    }
                }

                try
                {
                    await db.SaveChangesAsync(ct);
                    await tx.CommitAsync(ct);
                    logger.LogInformation("Finalised {Board}/{Period} starting {Start} with {Count} rows", board, period, periodStart, top.Count);
                }
                catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_LeaderboardSnapshots", StringComparison.Ordinal) == true)
                {
                    // Another instance froze this period first; its rows are the truth.
                    await tx.RollbackAsync(ct);
                    db.ChangeTracker.Clear();
                    logger.LogInformation("Finalisation of {Board}/{Period} {Start} raced with another instance", board, period, periodStart);
                }
            });
        }
        finally
        {
            FinalizeLock.Release();
        }
    }

    /// <summary>Hands out the rank's store items, bumps achievement counters and queues a notification.</summary>
    private async Task GrantAsync(LeaderboardBoard board, LeaderboardPeriod period, int rank, long subjectId, List<StoreItem> items, DateTimeOffset now, CancellationToken ct)
    {
        long? notifyUserId;
        if (board == LeaderboardBoard.TopClubs)
        {
            var club = await db.Clubs.FirstOrDefaultAsync(c => c.Id == subjectId, ct);
            if (club is null)
            {
                return;
            }

            notifyUserId = club.OwnerId;
            foreach (var item in items)
            {
                if (!await db.ClubItems.AnyAsync(x => x.ClubId == club.Id && x.ItemId == item.Id, ct))
                {
                    db.ClubItems.Add(new ClubItem { ClubId = club.Id, ItemId = item.Id, AcquiredAt = now });
                }
            }

            if (rank == 1 && period == LeaderboardPeriod.Weekly)
            {
                club.WeeklyTopClubCount++;
                await BumpAchievementAsync(club.OwnerId, AchievementKind.WeeklyTopClub, now, ct);
            }
        }
        else
        {
            notifyUserId = subjectId;
            foreach (var item in items)
            {
                if (!await db.UserItems.AnyAsync(x => x.UserId == subjectId && x.ItemId == item.Id, ct))
                {
                    db.UserItems.Add(new UserItem { UserId = subjectId, ItemId = item.Id, AcquiredAt = now });
                }
            }

            if (rank == 1 && period == LeaderboardPeriod.Weekly)
            {
                await BumpAchievementAsync(subjectId, board == LeaderboardBoard.TopGifters ? AchievementKind.TopGifter : AchievementKind.TopReceiver, now, ct);
            }
        }

        var boardName = board switch
        {
            LeaderboardBoard.TopClubs => "Top Clubs",
            LeaderboardBoard.TopGifters => "Top Gifters",
            _ => "Top Receivers",
        };
        var periodName = period == LeaderboardPeriod.Daily ? "yesterday" : "last week";
        var won = items.Count == 0 ? "" : $" You won: {string.Join(", ", items.Select(i => i.Name))}.";
        db.Notifications.Add(new Notification
        {
            UserId = notifyUserId.Value,
            Type = NotificationType.LeaderboardReward,
            Title = $"Rank #{rank} on {boardName}!",
            Body = $"You finished #{rank} on the {boardName} leaderboard {periodName}.{won}",
            DataJson = $"{{\"board\":\"{board}\",\"period\":\"{period}\",\"rank\":{rank}}}",
            CreatedAt = now,
        });
    }

    private async Task BumpAchievementAsync(long userId, AchievementKind kind, DateTimeOffset now, CancellationToken ct)
    {
        var row = await db.Achievements.FirstOrDefaultAsync(a => a.UserId == userId && a.Kind == kind, ct);
        if (row is null)
        {
            db.Achievements.Add(new Achievement { UserId = userId, Kind = kind, Count = 1, LastAt = now });
        }
        else
        {
            row.Count++;
            row.LastAt = now;
        }
    }

    // ---- shared ----------------------------------------------------------------

    private sealed class ScoreRow
    {
        public long Id { get; init; }
        public long Score { get; init; }
    }

    private IQueryable<ScoreRow> Scores(LeaderboardBoard board, DateTimeOffset start, DateTimeOffset end)
    {
        var inPeriod = db.GiftTransactions.AsNoTracking().Where(t => t.CreatedAt >= start && t.CreatedAt < end);
        return board switch
        {
            LeaderboardBoard.TopClubs => inPeriod.GroupBy(t => t.ClubId).Select(g => new ScoreRow { Id = g.Key, Score = g.Sum(t => t.Hearts) }),
            LeaderboardBoard.TopGifters => inPeriod.GroupBy(t => t.SenderId).Select(g => new ScoreRow { Id = g.Key, Score = g.Sum(t => t.Hearts) }),
            _ => inPeriod.Where(t => t.ReceiverId != null).GroupBy(t => t.ReceiverId!.Value).Select(g => new ScoreRow { Id = g.Key, Score = g.Sum(t => t.Hearts) }),
        };
    }

    /// <summary>Turns (id, score) rows into display rows, keeping the input order and assigning ranks 1..n.</summary>
    private async Task<IReadOnlyList<LeaderboardEntryDto>> HydrateAsync(LeaderboardBoard board, IReadOnlyList<ScoreRow> rows, CancellationToken ct)
    {
        if (rows.Count == 0)
        {
            return [];
        }

        var ids = rows.Select(r => r.Id).ToArray();
        Dictionary<long, LeaderboardEntryDto> byId;
        if (board == LeaderboardBoard.TopClubs)
        {
            byId = await db.Clubs.AsNoTracking().Where(c => ids.Contains(c.Id))
                .Select(c => new { c.Id, Dto = new LeaderboardEntryDto(0, c.PublicId, c.Name, c.CoverUrl, c.CountryCode, c.Country != null ? c.Country.FlagEmoji : null, c.Level, RoyalLevel.None, 0) })
                .ToDictionaryAsync(x => x.Id, x => x.Dto, ct);
        }
        else
        {
            byId = await db.Users.AsNoTracking().Where(u => ids.Contains(u.Id))
                .Select(u => new { u.Id, Dto = new LeaderboardEntryDto(0, u.PublicId, u.DisplayName, u.AvatarUrl, u.CountryCode, u.Country != null ? u.Country.FlagEmoji : null, u.Level, u.RoyalLevel, 0) })
                .ToDictionaryAsync(x => x.Id, x => x.Dto, ct);
        }

        var result = new List<LeaderboardEntryDto>(rows.Count);
        foreach (var row in rows)
        {
            if (byId.TryGetValue(row.Id, out var dto))
            {
                result.Add(dto with { Rank = result.Count + 1, Score = row.Score });
            }
        }

        return result;
    }
}
