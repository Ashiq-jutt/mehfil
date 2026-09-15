using Mehfil.Core.Enums;
using Mehfil.Core.Leaderboards;

namespace Mehfil.Tests.Unit;

public sealed class LeaderboardPeriodsTests
{
    // Wednesday 2026-09-16 13:45 UTC
    private static readonly DateTimeOffset Now = new(2026, 9, 16, 13, 45, 0, TimeSpan.Zero);

    [Fact]
    public void Daily_IsTheUtcDay()
    {
        var (start, end) = LeaderboardPeriods.Current(LeaderboardPeriod.Daily, Now);

        Assert.Equal(new DateTimeOffset(2026, 9, 16, 0, 0, 0, TimeSpan.Zero), start);
        Assert.Equal(start.AddDays(1), end);

        var (prevStart, prevEnd) = LeaderboardPeriods.Previous(LeaderboardPeriod.Daily, Now);
        Assert.Equal(start.AddDays(-1), prevStart);
        Assert.Equal(start, prevEnd);
    }

    [Fact]
    public void Weekly_StartsOnMonday()
    {
        var (start, end) = LeaderboardPeriods.Current(LeaderboardPeriod.Weekly, Now);

        Assert.Equal(DayOfWeek.Monday, start.DayOfWeek);
        Assert.Equal(new DateTimeOffset(2026, 9, 14, 0, 0, 0, TimeSpan.Zero), start);
        Assert.Equal(start.AddDays(7), end);

        var (prevStart, prevEnd) = LeaderboardPeriods.Previous(LeaderboardPeriod.Weekly, Now);
        Assert.Equal(start.AddDays(-7), prevStart);
        Assert.Equal(start, prevEnd);
    }

    [Fact]
    public void Weekly_OnSunday_StillBelongsToTheWeekThatStartedLastMonday()
    {
        var sunday = new DateTimeOffset(2026, 9, 20, 23, 59, 0, TimeSpan.Zero);
        var (start, end) = LeaderboardPeriods.Current(LeaderboardPeriod.Weekly, sunday);

        Assert.Equal(new DateTimeOffset(2026, 9, 14, 0, 0, 0, TimeSpan.Zero), start);
        Assert.True(end > sunday);
    }

    [Fact]
    public void Current_IgnoresLocalOffsets()
    {
        var local = new DateTimeOffset(2026, 9, 17, 3, 0, 0, TimeSpan.FromHours(5)); // 2026-09-16 22:00 UTC
        var (start, _) = LeaderboardPeriods.Current(LeaderboardPeriod.Daily, local);

        Assert.Equal(new DateTimeOffset(2026, 9, 16, 0, 0, 0, TimeSpan.Zero), start);
    }

    [Fact]
    public void Labels_MatchTheDesign()
    {
        Assert.Equal("Today", LeaderboardPeriods.CurrentLabel(LeaderboardPeriod.Daily));
        Assert.Equal("Yesterday", LeaderboardPeriods.PreviousLabel(LeaderboardPeriod.Daily));
        Assert.Equal("This Week", LeaderboardPeriods.CurrentLabel(LeaderboardPeriod.Weekly));
        Assert.Equal("Last Week", LeaderboardPeriods.PreviousLabel(LeaderboardPeriod.Weekly));
    }
}
