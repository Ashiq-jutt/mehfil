using System.Text.Json;
using Mehfil.Core.Enums;
using Mehfil.Core.Leaderboards;
using Mehfil.Core.Store;
using Mehfil.Infrastructure.Data.Seed;

namespace Mehfil.Tests.Unit;

/// <summary>The seed is upserted on every startup, so a broken row would break a running deployment.</summary>
public sealed class SeedDataTests
{
    [Fact]
    public void Countries_HaveUniqueCodesAndFeaturedChips()
    {
        var countries = SeedData.Countries().ToList();

        Assert.NotEmpty(countries);
        Assert.Equal(countries.Count, countries.Select(c => c.Code).Distinct().Count());
        Assert.All(countries, c => Assert.Equal(2, c.Code.Length));
        Assert.All(countries, c => Assert.False(string.IsNullOrWhiteSpace(c.FlagEmoji)));
        Assert.InRange(countries.Count(c => c.IsFeatured), 1, 8);
    }

    [Fact]
    public void Gifts_HaveUniqueCodesAndRisingPrices()
    {
        var gifts = SeedData.Gifts().OrderBy(g => g.SortOrder).ToList();

        Assert.Equal(gifts.Count, gifts.Select(g => g.Code).Distinct().Count());
        Assert.All(gifts, g => Assert.True(g.HeartsPrice > 0));
        Assert.Equal(gifts.Select(g => g.HeartsPrice).OrderBy(p => p), gifts.Select(g => g.HeartsPrice));
    }

    [Fact]
    public void HeartsPackages_HaveExactlyOneWelcomeOffer_WithParsableBonusGifts()
    {
        var packages = SeedData.Packages().ToList();
        var giftCodes = SeedData.Gifts().Select(g => (string?)g.Code).ToHashSet();

        Assert.Equal(packages.Count, packages.Select(p => p.Code).Distinct().Count());
        var welcome = Assert.Single(packages, p => p.IsWelcomeOffer);
        Assert.NotNull(welcome.BonusGiftsJson);

        using var document = JsonDocument.Parse(welcome.BonusGiftsJson!);
        Assert.NotEmpty(document.RootElement.EnumerateArray());
        foreach (var bonus in document.RootElement.EnumerateArray())
        {
            Assert.Contains(bonus.GetProperty("giftCode").GetString(), giftCodes);
            Assert.True(bonus.GetProperty("qty").GetInt32() > 0);
        }

        Assert.All(packages, p => Assert.True(p.PriceMinor > 0 && p.Hearts > 0));
        Assert.True(packages.Count(p => p.IsBest) <= 1);
    }

    [Fact]
    public void StoreItems_HaveOneDefaultPerEquippableKind()
    {
        var items = SeedData.StoreItems().ToList();

        Assert.Equal(items.Count, items.Select(i => i.Code).Distinct().Count());
        foreach (var kind in new[] { StoreItemKind.Frame, StoreItemKind.ChatBubble, StoreItemKind.EntryStyle, StoreItemKind.Background, StoreItemKind.Card })
        {
            Assert.Single(items, i => i.Kind == kind && StoreRules.IsDefaultItem(i.UnlockRule, i.Code));
        }
    }

    [Fact]
    public void StoreItems_CarryTheRuleParametersTheyNeed()
    {
        foreach (var item in SeedData.StoreItems())
        {
            switch (item.UnlockRule)
            {
                case UnlockRule.Leaderboard:
                    Assert.NotNull(item.UnlockBoard);
                    Assert.InRange(item.UnlockValue, 1, LeaderboardPeriods.RewardedRanks);
                    Assert.False(string.IsNullOrWhiteSpace(item.UnlockLabel));
                    break;
                case UnlockRule.RoyalLevel:
                    Assert.InRange(item.UnlockValue, 1, 6);
                    break;
                case UnlockRule.PrimeLevel:
                    Assert.InRange(item.UnlockValue, 1, 3);
                    break;
                case UnlockRule.ClubLevel:
                    Assert.True(item.UnlockValue > 0);
                    break;
                case UnlockRule.Purchase:
                    Assert.True(item.HeartsPrice > 0, $"{item.Code} is purchasable but has no price");
                    break;
                default:
                    Assert.Equal(UnlockRule.Default, item.UnlockRule);
                    break;
            }
        }
    }

    [Fact]
    public void EveryRewardedLeaderboardRank_HasAtLeastOneItem()
    {
        var items = SeedData.StoreItems().Where(i => i.UnlockRule == UnlockRule.Leaderboard).ToList();

        foreach (var board in Enum.GetValues<LeaderboardBoard>())
        {
            Assert.Contains(items, i => i.UnlockBoard == board && i.UnlockValue == 1);
        }
    }
}
