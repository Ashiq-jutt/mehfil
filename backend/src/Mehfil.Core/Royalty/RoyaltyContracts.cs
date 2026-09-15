using Mehfil.Core.Enums;

namespace Mehfil.Core.Royalty;

public sealed record RoyaltyLevelDto(string Code, int Rank, long PointsRequired, bool Achieved, DateTimeOffset? AchievedAt);

public sealed record RoyaltyDto(
    long Points,
    RoyalLevel RoyalLevel,
    RoyalLevel HighestRoyalLevel,
    PrimeLevel PrimeLevel,
    int StreakMonths,
    string? NextLevelCode,
    long? PointsToNextLevel,
    IReadOnlyList<RoyaltyLevelDto> RoyalLevels,
    IReadOnlyList<RoyaltyLevelDto> PrimeLevels,
    IReadOnlyList<string> Benefits);

public interface IRoyaltyService
{
    Task<RoyaltyDto> GetAsync(long userId, CancellationToken ct);
}

/// <summary>
/// Royalty points are earned by buying hearts (each package carries RoyaltyPoints).
/// Royal tiers R1–R6 come first; Prime tiers P1–P3 sit above R6. Pure and unit-testable.
/// </summary>
public static class RoyaltyLevels
{
    public static readonly IReadOnlyList<(RoyalLevel Level, long Points)> Royal =
    [
        (RoyalLevel.R1, 1_000),
        (RoyalLevel.R2, 5_000),
        (RoyalLevel.R3, 15_000),
        (RoyalLevel.R4, 40_000),
        (RoyalLevel.R5, 100_000),
        (RoyalLevel.R6, 250_000),
    ];

    public static readonly IReadOnlyList<(PrimeLevel Level, long Points)> Prime =
    [
        (PrimeLevel.P1, 500_000),
        (PrimeLevel.P2, 1_000_000),
        (PrimeLevel.P3, 2_500_000),
    ];

    public static readonly IReadOnlyList<string> Benefits =
    [
        "Exclusive Royal frames, chat bubbles and entry styles in the Club Store",
        "Royal badge shown next to your name in every club",
        "Priority seat requests in busy clubs",
        "Monthly Royal streak rewards",
    ];

    public static (RoyalLevel Royal, PrimeLevel Prime) Compute(long points)
    {
        var royal = RoyalLevel.None;
        foreach (var (level, required) in Royal)
        {
            if (points >= required)
            {
                royal = level;
            }
        }

        var prime = PrimeLevel.None;
        foreach (var (level, required) in Prime)
        {
            if (points >= required)
            {
                prime = level;
            }
        }

        return (royal, prime);
    }

    /// <summary>The next tier above the current points, or null when P3 is reached.</summary>
    public static (string Code, long PointsRequired)? Next(long points)
    {
        foreach (var (level, required) in Royal)
        {
            if (points < required)
            {
                return (level.ToString(), required);
            }
        }

        foreach (var (level, required) in Prime)
        {
            if (points < required)
            {
                return (level.ToString(), required);
            }
        }

        return null;
    }
}
