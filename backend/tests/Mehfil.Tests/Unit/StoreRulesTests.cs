using Mehfil.Core.Enums;
using Mehfil.Core.Store;

namespace Mehfil.Tests.Unit;

public sealed class StoreRulesTests
{
    [Theory]
    [InlineData(UnlockRule.Default, 0, false, RoyalLevel.None, PrimeLevel.None, 0, true)]
    [InlineData(UnlockRule.Leaderboard, 1, false, RoyalLevel.R6, PrimeLevel.P3, 99, false)]
    [InlineData(UnlockRule.Leaderboard, 1, true, RoyalLevel.None, PrimeLevel.None, 0, true)]
    [InlineData(UnlockRule.RoyalLevel, 4, false, RoyalLevel.R3, PrimeLevel.None, 0, false)]
    [InlineData(UnlockRule.RoyalLevel, 4, false, RoyalLevel.R4, PrimeLevel.None, 0, true)]
    [InlineData(UnlockRule.PrimeLevel, 2, false, RoyalLevel.R6, PrimeLevel.P1, 0, false)]
    [InlineData(UnlockRule.PrimeLevel, 2, false, RoyalLevel.None, PrimeLevel.P2, 0, true)]
    [InlineData(UnlockRule.ClubLevel, 20, false, RoyalLevel.None, PrimeLevel.None, 19, false)]
    [InlineData(UnlockRule.ClubLevel, 20, false, RoyalLevel.None, PrimeLevel.None, 20, true)]
    [InlineData(UnlockRule.Purchase, 0, false, RoyalLevel.R6, PrimeLevel.P3, 99, false)]
    [InlineData(UnlockRule.Purchase, 0, true, RoyalLevel.None, PrimeLevel.None, 0, true)]
    public void IsUnlocked_FollowsEachRule(UnlockRule rule, int value, bool owned, RoyalLevel royal, PrimeLevel prime, int clubLevel, bool expected)
    {
        Assert.Equal(expected, StoreRules.IsUnlocked(rule, value, owned, royal, prime, clubLevel));
    }

    [Fact]
    public void DefaultItems_AreTheSeededDefaults()
    {
        Assert.True(StoreRules.IsDefaultItem(UnlockRule.Default, "frame_default"));
        Assert.False(StoreRules.IsDefaultItem(UnlockRule.Default, "clubdp_lantern"));
        Assert.False(StoreRules.IsDefaultItem(UnlockRule.Leaderboard, "frame_default"));
    }

    [Fact]
    public void ClubKinds_AreBackgroundsAndDps()
    {
        Assert.True(StoreRules.IsClubKind(StoreItemKind.Background));
        Assert.True(StoreRules.IsClubKind(StoreItemKind.ClubDp));
        Assert.False(StoreRules.IsClubKind(StoreItemKind.Frame));
        Assert.False(StoreRules.IsClubKind(StoreItemKind.Card));
    }

    [Fact]
    public void IsNew_OnlyWithinAWeek_AndNeverUsed()
    {
        var now = new DateTimeOffset(2026, 9, 16, 0, 0, 0, TimeSpan.Zero);
        Assert.True(StoreRules.IsNew(now.AddDays(-2), false, now));
        Assert.False(StoreRules.IsNew(now.AddDays(-2), true, now));
        Assert.False(StoreRules.IsNew(now.AddDays(-8), false, now));
        Assert.False(StoreRules.IsNew(null, false, now));
    }
}
