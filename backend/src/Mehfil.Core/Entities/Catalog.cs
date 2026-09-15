using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Entities;

/// <summary>ISO-3166 alpha-2 country used for club filtering and profile flags. Seeded.</summary>
public class Country
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string FlagEmoji { get; set; }

    /// <summary>Featured countries appear as chips on Clubs Home; the rest are behind "More".</summary>
    public bool IsFeatured { get; set; }

    public int SortOrder { get; set; }
}

/// <summary>Club category tag (Friends, Fun, Family, Game). Seeded.</summary>
public class ClubCategory : Entity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>Gift catalog. Seeded; prices in hearts.</summary>
public class Gift : Entity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string IconUrl { get; set; }
    public string? AnimationUrl { get; set; }
    public long HeartsPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>Purchasable hearts bundle shown in the Shop. Seeded.</summary>
public class HeartsPackage : Entity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public long Hearts { get; set; }

    /// <summary>Price in minor units (e.g. paisa for PKR).</summary>
    public long PriceMinor { get; set; }

    public required string Currency { get; set; }
    public int RoyaltyPoints { get; set; }
    public string? IconUrl { get; set; }
    public string? StoreProductIdAndroid { get; set; }
    public string? StoreProductIdIos { get; set; }
    public bool IsBest { get; set; }
    public bool IsWelcomeOffer { get; set; }

    /// <summary>Extra gifts bundled with the package (welcome offer), as JSON: [{giftCode, qty}].</summary>
    public string? BonusGiftsJson { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>Cosmetic item in the Club Store (frame, chat bubble, entry style, background, card, club DP). Seeded.</summary>
public class StoreItem : Entity
{
    public required string Code { get; set; }
    public StoreItemKind Kind { get; set; }
    public required string Name { get; set; }
    public required string AssetUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public UnlockRule UnlockRule { get; set; } = UnlockRule.Default;

    /// <summary>Rule parameter: royal/prime/club level number, or leaderboard rank.</summary>
    public int UnlockValue { get; set; }

    /// <summary>Board for Leaderboard unlocks (e.g. Top Gifters rank #2).</summary>
    public LeaderboardBoard? UnlockBoard { get; set; }

    /// <summary>Human label shown under locked items, e.g. "Win via Leaderboard".</summary>
    public string? UnlockLabel { get; set; }

    public long? HeartsPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
