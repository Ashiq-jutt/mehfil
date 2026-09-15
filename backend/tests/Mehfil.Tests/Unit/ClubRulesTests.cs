using Mehfil.Infrastructure.Clubs;

namespace Mehfil.Tests.Unit;

public sealed class ClubRulesTests
{
    [Fact]
    public void NextJarReset_IsNextUtcMidnight()
    {
        var now = new DateTimeOffset(2026, 9, 15, 8, 23, 0, TimeSpan.Zero);

        var reset = ClubService.NextJarReset(now);

        Assert.Equal(new DateTimeOffset(2026, 9, 16, 0, 0, 0, TimeSpan.Zero), reset);
        Assert.True(reset - now < TimeSpan.FromHours(24));
    }

    [Fact]
    public void NextJarReset_ConvertsLocalOffsetsToUtc()
    {
        var now = new DateTimeOffset(2026, 9, 15, 23, 30, 0, TimeSpan.FromHours(5)); // 18:30 UTC

        var reset = ClubService.NextJarReset(now);

        Assert.Equal(new DateTimeOffset(2026, 9, 16, 0, 0, 0, TimeSpan.Zero), reset);
    }
}
