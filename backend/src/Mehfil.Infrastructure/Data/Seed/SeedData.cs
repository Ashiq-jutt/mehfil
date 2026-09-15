using Mehfil.Core.Entities;
using Mehfil.Core.Enums;

namespace Mehfil.Infrastructure.Data.Seed;

/// <summary>
/// Catalog definitions. Asset URLs are relative to the API's static file root and are
/// placeholders until the original artwork lands in a later phase.
/// </summary>
public static class SeedData
{
    public static IEnumerable<Country> Countries()
    {
        // Featured chips (in this order) on Clubs Home, then the rest alphabetically behind "More".
        (string Code, string Name, string Flag, bool Featured)[] list =
        [
            ("PK", "Pakistan", "🇵🇰", true),
            ("BD", "Bangladesh", "🇧🇩", true),
            ("GB", "United Kingdom", "🇬🇧", true),
            ("IN", "India", "🇮🇳", true),
            ("SA", "Saudi Arabia", "🇸🇦", true),
            ("US", "United States", "🇺🇸", true),
            ("AE", "United Arab Emirates", "🇦🇪", true),
            ("TR", "Türkiye", "🇹🇷", true),
            ("AF", "Afghanistan", "🇦🇫", false),
            ("AU", "Australia", "🇦🇺", false),
            ("BH", "Bahrain", "🇧🇭", false),
            ("CA", "Canada", "🇨🇦", false),
            ("DE", "Germany", "🇩🇪", false),
            ("EG", "Egypt", "🇪🇬", false),
            ("FR", "France", "🇫🇷", false),
            ("ID", "Indonesia", "🇮🇩", false),
            ("IQ", "Iraq", "🇮🇶", false),
            ("IR", "Iran", "🇮🇷", false),
            ("IT", "Italy", "🇮🇹", false),
            ("JO", "Jordan", "🇯🇴", false),
            ("JP", "Japan", "🇯🇵", false),
            ("KW", "Kuwait", "🇰🇼", false),
            ("LK", "Sri Lanka", "🇱🇰", false),
            ("MA", "Morocco", "🇲🇦", false),
            ("MY", "Malaysia", "🇲🇾", false),
            ("NG", "Nigeria", "🇳🇬", false),
            ("NL", "Netherlands", "🇳🇱", false),
            ("NP", "Nepal", "🇳🇵", false),
            ("NO", "Norway", "🇳🇴", false),
            ("OM", "Oman", "🇴🇲", false),
            ("PH", "Philippines", "🇵🇭", false),
            ("PT", "Portugal", "🇵🇹", false),
            ("QA", "Qatar", "🇶🇦", false),
            ("SE", "Sweden", "🇸🇪", false),
            ("SG", "Singapore", "🇸🇬", false),
            ("TN", "Tunisia", "🇹🇳", false),
            ("ZA", "South Africa", "🇿🇦", false),
        ];

        return list.Select((c, i) => new Country
        {
            Code = c.Code,
            Name = c.Name,
            FlagEmoji = c.Flag,
            IsFeatured = c.Featured,
            SortOrder = i,
        });
    }

    public static IEnumerable<ClubCategory> Categories() =>
        new[] { "Friends", "Fun", "Family", "Game" }.Select((n, i) => new ClubCategory
        {
            Code = n.ToLowerInvariant(),
            Name = n,
            SortOrder = i,
        });

    public static IEnumerable<Gift> Gifts()
    {
        (string Code, string Name, long Price)[] list =
        [
            ("rose", "Rose", 5),
            ("chocolate", "Chocolate Box", 20),
            ("bouquet", "Bouquet", 50),
            ("teddy", "Teddy Bear", 100),
            ("perfume", "Perfume", 250),
            ("crown", "Crown", 500),
            ("ring", "Diamond Ring", 1000),
            ("sportscar", "Sports Car", 5000),
            ("yacht", "Yacht", 10000),
            ("castle", "Castle", 50000),
        ];

        return list.Select((g, i) => new Gift
        {
            Code = g.Code,
            Name = g.Name,
            IconUrl = $"/assets/gifts/{g.Code}.png",
            HeartsPrice = g.Price,
            IsActive = true,
            SortOrder = i,
        });
    }

    public static IEnumerable<HeartsPackage> Packages()
    {
        // Prices in PKR minor units (paisa). Store product ids follow "hearts_<amount>".
        (string Code, string Name, long Hearts, long PricePkr, int Royalty, bool Best, bool Welcome)[] list =
        [
            ("welcome_350", "Welcome Offer", 350, 300, 1, false, true),
            ("hearts_350", "350 Hearts", 350, 300, 1, false, false),
            ("hearts_1100", "1,100 Hearts", 1100, 900, 3, false, false),
            ("hearts_3700", "3,700 Hearts", 3700, 2900, 10, false, false),
            ("hearts_7500", "7,500 Hearts", 7500, 4900, 20, false, false),
            ("hearts_41000", "41,000 Hearts", 41000, 24900, 100, false, false),
            ("hearts_99000", "99,000 Hearts", 99000, 59900, 240, true, false),
        ];

        return list.Select((p, i) => new HeartsPackage
        {
            Code = p.Code,
            Name = p.Name,
            Hearts = p.Hearts,
            PriceMinor = p.PricePkr * 100,
            Currency = "PKR",
            RoyaltyPoints = p.Royalty,
            IconUrl = $"/assets/shop/{p.Code}.png",
            StoreProductIdAndroid = p.Code,
            StoreProductIdIos = p.Code,
            IsBest = p.Best,
            IsWelcomeOffer = p.Welcome,
            BonusGiftsJson = p.Welcome ? """[{"giftCode":"rose","qty":5},{"giftCode":"bouquet","qty":5},{"giftCode":"chocolate","qty":4}]""" : null,
            IsActive = true,
            SortOrder = i,
        });
    }

    public static IEnumerable<StoreItem> StoreItems()
    {
        var items = new List<StoreItem>();
        var order = 0;

        StoreItem Add(StoreItemKind kind, string code, string name, UnlockRule rule = UnlockRule.Default,
            int value = 0, LeaderboardBoard? board = null, string? label = null, long? price = null)
        {
            var item = new StoreItem
            {
                Code = $"{kind.ToString().ToLowerInvariant()}_{code}",
                Kind = kind,
                Name = name,
                AssetUrl = $"/assets/store/{kind.ToString().ToLowerInvariant()}/{code}.png",
                PreviewUrl = $"/assets/store/{kind.ToString().ToLowerInvariant()}/{code}_preview.png",
                UnlockRule = rule,
                UnlockValue = value,
                UnlockBoard = board,
                UnlockLabel = label ?? rule switch
                {
                    UnlockRule.Default => null,
                    UnlockRule.Leaderboard => "Win via Leaderboard",
                    UnlockRule.RoyalLevel => $"Royal {value}",
                    UnlockRule.PrimeLevel => $"Prime {value}",
                    UnlockRule.ClubLevel => $"Club Level {value}",
                    UnlockRule.Purchase => "Purchase",
                    _ => null,
                },
                HeartsPrice = price,
                IsActive = true,
                SortOrder = order++,
            };
            items.Add(item);
            return item;
        }

        // Frames (profile avatar rings)
        Add(StoreItemKind.Frame, "default", "Default");
        Add(StoreItemKind.Frame, "sapphire_crest", "Sapphire Crest", UnlockRule.Leaderboard, 1, LeaderboardBoard.TopGifters, "Top Gifters · Rank #1");
        Add(StoreItemKind.Frame, "amethyst_crown", "Amethyst Crown", UnlockRule.Leaderboard, 2, LeaderboardBoard.TopGifters, "Top Gifters · Rank #2");
        Add(StoreItemKind.Frame, "ruby_bloom", "Ruby Bloom", UnlockRule.Leaderboard, 1, LeaderboardBoard.TopReceivers, "Top Receivers · Rank #1");
        Add(StoreItemKind.Frame, "emerald_wreath", "Emerald Wreath", UnlockRule.Leaderboard, 2, LeaderboardBoard.TopReceivers, "Top Receivers · Rank #2");
        for (var r = 6; r >= 1; r--)
        {
            Add(StoreItemKind.Frame, $"royal_{r}", $"Royal {r} Frame", UnlockRule.RoyalLevel, r);
        }
        for (var p = 3; p >= 1; p--)
        {
            Add(StoreItemKind.Frame, $"prime_{p}", $"Prime {p} Frame", UnlockRule.PrimeLevel, p);
        }

        // Chat bubbles
        Add(StoreItemKind.ChatBubble, "default", "Default");
        Add(StoreItemKind.ChatBubble, "gold_scroll", "Gold Scroll", UnlockRule.Leaderboard, 1, LeaderboardBoard.TopGifters, "Top Gifters · Rank #1");
        Add(StoreItemKind.ChatBubble, "petal_frame", "Petal Frame", UnlockRule.Leaderboard, 2, LeaderboardBoard.TopGifters, "Top Gifters · Rank #2");
        Add(StoreItemKind.ChatBubble, "crystal_edge", "Crystal Edge", UnlockRule.Leaderboard, 3, LeaderboardBoard.TopGifters, "Top Gifters · Rank #3");
        Add(StoreItemKind.ChatBubble, "royal_6", "Royal Bubble", UnlockRule.RoyalLevel, 6);
        Add(StoreItemKind.ChatBubble, "royal_4", "Noble Bubble", UnlockRule.RoyalLevel, 4);

        // Entry styles (room entry animation)
        Add(StoreItemKind.EntryStyle, "default", "Default");
        Add(StoreItemKind.EntryStyle, "speedboat", "Speedboat", UnlockRule.Leaderboard, 1, LeaderboardBoard.TopGifters, "Top Gifters · Rank #1");
        Add(StoreItemKind.EntryStyle, "jet", "Private Jet", UnlockRule.RoyalLevel, 6);
        Add(StoreItemKind.EntryStyle, "balloon", "Hot Air Balloon", UnlockRule.RoyalLevel, 5);
        Add(StoreItemKind.EntryStyle, "biplane", "Biplane", UnlockRule.RoyalLevel, 4);
        Add(StoreItemKind.EntryStyle, "helicopter", "Helicopter", UnlockRule.RoyalLevel, 3);
        Add(StoreItemKind.EntryStyle, "parachute", "Parachute", UnlockRule.RoyalLevel, 2);

        // Room backgrounds
        Add(StoreItemKind.Background, "default", "Night City");
        Add(StoreItemKind.Background, "trophy_gold", "Golden Trophy", UnlockRule.Leaderboard, 1, LeaderboardBoard.TopClubs, "Top Clubs · Rank #1");
        Add(StoreItemKind.Background, "trophy_silver", "Silver Trophy", UnlockRule.Leaderboard, 2, LeaderboardBoard.TopClubs, "Top Clubs · Rank #2");
        Add(StoreItemKind.Background, "trophy_bronze", "Bronze Trophy", UnlockRule.Leaderboard, 3, LeaderboardBoard.TopClubs, "Top Clubs · Rank #3");
        foreach (var lvl in new[] { 4, 20, 25, 29, 32, 34, 36 })
        {
            Add(StoreItemKind.Background, $"club_{lvl}", $"Level {lvl} Scene", UnlockRule.ClubLevel, lvl);
        }

        // Cards (profile card skins)
        Add(StoreItemKind.Card, "default", "Default");
        foreach (var lvl in new[] { 12, 21, 31, 41, 50 })
        {
            Add(StoreItemKind.Card, $"club_{lvl}", $"Level {lvl} Card", UnlockRule.ClubLevel, lvl);
        }

        // Club display pictures (free set)
        foreach (var (code, name) in new[]
                 {
                     ("lantern", "Lantern"), ("mandala", "Mandala"), ("teapot", "Teapot"), ("lamp", "Oil Lamp"),
                     ("shield", "Shield"), ("dunes", "Dunes"), ("skyline", "Skyline"), ("harbour", "Harbour"),
                 })
        {
            Add(StoreItemKind.ClubDp, code, name);
        }

        return items;
    }
}
