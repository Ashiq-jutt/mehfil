using Mehfil.Core.Enums;

namespace Mehfil.Core.Leaderboards;

/// <summary>One ranked row. Id/Name/ImageUrl refer to a club (Top Clubs) or a user (Top Gifters / Top Receivers).</summary>
public sealed record LeaderboardEntryDto(
    int Rank,
    string Id,
    string Name,
    string? ImageUrl,
    string? CountryCode,
    string? FlagEmoji,
    int Level,
    RoyalLevel RoyalLevel,
    long Score);

/// <summary>A finished or running period: "Yesterday" / "Today" / "Last Week" / "This Week".</summary>
public sealed record LeaderboardPeriodDto(
    string Label,
    DateTimeOffset Start,
    DateTimeOffset End,
    long TotalHearts,
    IReadOnlyList<LeaderboardEntryDto> Entries);

public sealed record LeaderboardDto(
    LeaderboardBoard Board,
    LeaderboardPeriod Period,
    LeaderboardPeriodDto Previous,
    LeaderboardPeriodDto Current,
    /// <summary>The caller's own row in the current period (their club on Top Clubs). Null when they have no club / never gifted.</summary>
    LeaderboardEntryDto? Me);

public sealed record RewardItemDto(string Code, StoreItemKind Kind, string Name, string AssetUrl, string? PreviewUrl);

public sealed record RewardRankDto(int Rank, IReadOnlyList<RewardItemDto> Items);

public sealed record BoardRewardsDto(LeaderboardBoard Board, IReadOnlyList<RewardRankDto> Ranks);

public sealed record LeaderboardRewardsDto(IReadOnlyList<BoardRewardsDto> Boards);

public interface ILeaderboardService
{
    /// <summary>Previous (frozen, rewards granted) and current (live) rankings for a board and period, plus the caller's row.</summary>
    Task<LeaderboardDto> GetAsync(long userId, LeaderboardBoard board, LeaderboardPeriod period, CancellationToken ct);

    /// <summary>Store items won at each rank of each board ("Rewards" modal).</summary>
    Task<LeaderboardRewardsDto> GetRewardsAsync(CancellationToken ct);
}

/// <summary>Period boundaries (pure). Days are UTC days; weeks start on Monday 00:00 UTC.</summary>
public static class LeaderboardPeriods
{
    /// <summary>How many rows are frozen into a snapshot when a period ends.</summary>
    public const int SnapshotSize = 20;

    /// <summary>How many ranks receive store-item rewards.</summary>
    public const int RewardedRanks = 3;

    public static (DateTimeOffset Start, DateTimeOffset End) Current(LeaderboardPeriod period, DateTimeOffset now)
    {
        var day = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        if (period == LeaderboardPeriod.Daily)
        {
            return (day, day.AddDays(1));
        }

        var daysSinceMonday = ((int)day.DayOfWeek + 6) % 7;
        var weekStart = day.AddDays(-daysSinceMonday);
        return (weekStart, weekStart.AddDays(7));
    }

    public static (DateTimeOffset Start, DateTimeOffset End) Previous(LeaderboardPeriod period, DateTimeOffset now)
    {
        var (start, _) = Current(period, now);
        return (period == LeaderboardPeriod.Daily ? start.AddDays(-1) : start.AddDays(-7), start);
    }

    public static string CurrentLabel(LeaderboardPeriod period) => period == LeaderboardPeriod.Daily ? "Today" : "This Week";

    public static string PreviousLabel(LeaderboardPeriod period) => period == LeaderboardPeriod.Daily ? "Yesterday" : "Last Week";
}
