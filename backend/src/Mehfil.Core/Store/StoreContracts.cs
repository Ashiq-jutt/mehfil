using Mehfil.Core.Enums;

namespace Mehfil.Core.Store;

public sealed record StoreItemDto(
    string Code,
    StoreItemKind Kind,
    string Name,
    string AssetUrl,
    string? PreviewUrl,
    UnlockRule UnlockRule,
    int UnlockValue,
    LeaderboardBoard? UnlockBoard,
    string? UnlockLabel,
    long? HeartsPrice,
    /// <summary>Usable by the caller (won, reached the level/tier, bought, or a default item).</summary>
    bool IsOwned,
    bool IsEquipped,
    /// <summary>Not owned and not purchasable with hearts.</summary>
    bool IsLocked,
    string? LockReason,
    /// <summary>Acquired in the last 7 days and never used yet (tab badge).</summary>
    bool IsNew);

public sealed record StoreKindDto(StoreItemKind Kind, int Count, int NewCount);

public sealed record StoreDto(
    long Balance,
    string? ClubId,
    string? ClubName,
    int ClubLevel,
    RoyalLevel HighestRoyalLevel,
    PrimeLevel PrimeLevel,
    IReadOnlyList<StoreKindDto> Kinds,
    IReadOnlyList<StoreItemDto> Items);

/// <summary>Kind that changed and the code now equipped (null = back to default / nothing).</summary>
public sealed record EquipResultDto(StoreItemKind Kind, string? EquippedCode);

public sealed record BuyResultDto(string Code, long Balance);

public interface IStoreService
{
    Task<StoreDto> GetAsync(long userId, CancellationToken ct);

    /// <summary>Equips an unlocked item. Backgrounds and club DPs apply to the caller's own club.</summary>
    Task<EquipResultDto> EquipAsync(long userId, string code, CancellationToken ct);

    /// <summary>Buys a Purchase-rule item with hearts (atomic debit + ledger row).</summary>
    Task<BuyResultDto> BuyAsync(long userId, string code, CancellationToken ct);
}

/// <summary>Unlock rules (pure).</summary>
public static class StoreRules
{
    public static readonly TimeSpan NewWindow = TimeSpan.FromDays(7);

    /// <summary>Backgrounds and club DPs belong to a club; everything else to a user.</summary>
    public static bool IsClubKind(StoreItemKind kind) => kind is StoreItemKind.Background or StoreItemKind.ClubDp;

    /// <summary>The seeded "default" item of a kind: always usable, equipped when nothing else is.</summary>
    public static bool IsDefaultItem(UnlockRule rule, string code) => rule == UnlockRule.Default && code.EndsWith("_default", StringComparison.Ordinal);

    public static bool IsUnlocked(UnlockRule rule, int value, bool ownedExplicitly, RoyalLevel highestRoyal, PrimeLevel prime, int clubLevel) =>
        rule switch
        {
            UnlockRule.Default => true,
            UnlockRule.Leaderboard => ownedExplicitly,
            UnlockRule.RoyalLevel => ownedExplicitly || (int)highestRoyal >= value,
            UnlockRule.PrimeLevel => ownedExplicitly || (int)prime >= value,
            UnlockRule.ClubLevel => ownedExplicitly || clubLevel >= value,
            UnlockRule.Purchase => ownedExplicitly,
            _ => false,
        };

    public static bool IsNew(DateTimeOffset? acquiredAt, bool everEquipped, DateTimeOffset now) =>
        acquiredAt is not null && !everEquipped && now - acquiredAt.Value <= NewWindow;
}
