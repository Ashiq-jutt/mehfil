using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Rooms;

namespace Mehfil.Core.Economy;

// ---- Wallet ---------------------------------------------------------------

public sealed record LedgerEntryDto(long Id, long Delta, long BalanceAfter, LedgerReason Reason, string? Note, DateTimeOffset CreatedAt);

public sealed record WalletDto(long Balance, long HeartsGifted, long HeartsReceived, long RoyaltyPoints, PagedResult<LedgerEntryDto> Ledger);

public sealed record BonusGiftDto(string GiftCode, string GiftName, int Quantity);

public sealed record HeartsPackageDto(
    string Code,
    string Name,
    long Hearts,
    long PriceMinor,
    string Currency,
    int RoyaltyPoints,
    string? IconUrl,
    string? StoreProductIdAndroid,
    string? StoreProductIdIos,
    bool IsBest,
    bool IsWelcomeOffer,
    IReadOnlyList<BonusGiftDto> BonusGifts,
    bool IsAvailable);

/// <summary>Packages plus whether purchases are verified against the stores or accepted in sandbox mode.</summary>
public sealed record ShopDto(long Balance, bool SandboxMode, IReadOnlyList<HeartsPackageDto> Packages);

public sealed record VerifyPurchaseRequest(DevicePlatform Platform, string ProductId, string TransactionId, string? Receipt);

public sealed record PurchaseResultDto(long PurchaseId, PurchaseStatus Status, long HeartsGranted, long Balance, long RoyaltyPoints, RoyalLevel RoyalLevel, PrimeLevel PrimeLevel, bool AlreadyProcessed);

public sealed record DevGrantRequest(long Hearts);

public interface IWalletService
{
    Task<WalletDto> GetAsync(long userId, int? page, int? pageSize, CancellationToken ct);
    Task<ShopDto> GetShopAsync(long userId, CancellationToken ct);

    /// <summary>Verifies a store receipt (or accepts it in sandbox mode) and credits hearts + royalty points once per transaction id.</summary>
    Task<PurchaseResultDto> VerifyPurchaseAsync(long userId, VerifyPurchaseRequest request, CancellationToken ct);

    /// <summary>Development only: add hearts without a store purchase.</summary>
    Task<WalletDto> DevGrantAsync(long userId, long hearts, CancellationToken ct);
}

/// <summary>Store receipt verification. Sandbox implementation accepts everything; production ones call Google / Apple.</summary>
public interface IStoreReceiptVerifier
{
    bool IsSandbox { get; }
    Task<bool> VerifyAsync(DevicePlatform platform, string productId, string transactionId, string? receipt, CancellationToken ct);
}

// ---- Gifts ----------------------------------------------------------------

public sealed record GiftDto(string Code, string Name, string IconUrl, string? AnimationUrl, long HeartsPrice);

public sealed record SendGiftRequest(string GiftCode, int Quantity, string? ReceiverId);

public sealed record ClubLevelDto(int Level, long JarHearts, long JarTarget, DateTimeOffset JarResetsAt, int JarsCollected, int JarsForNextLevel, long TotalHearts);

/// <summary>Broadcast to the room when a gift is sent.</summary>
public sealed record GiftEventDto(
    long TransactionId,
    RoomUserDto Sender,
    RoomUserDto? Receiver,
    GiftDto Gift,
    int Quantity,
    long Hearts,
    ClubLevelDto ClubLevel,
    bool LeveledUp,
    DateTimeOffset CreatedAt);

public sealed record SendGiftResultDto(GiftEventDto Event, long Balance);

public interface IGiftService
{
    Task<IReadOnlyList<GiftDto>> GetCatalogAsync(CancellationToken ct);

    /// <summary>Sends a gift inside the room the user is in. Deducts hearts atomically, fills the jar, may level the club up.</summary>
    Task<SendGiftResultDto> SendAsync(long senderId, string clubPublicId, SendGiftRequest request, CancellationToken ct);

    Task<ClubLevelDto> GetClubLevelAsync(string clubPublicId, CancellationToken ct);
}

/// <summary>Club levelling rules (pure).</summary>
public static class ClubLevels
{
    public const long JarTarget = 500;

    /// <summary>Jars needed to go from <paramref name="level"/> to the next one (55 at level 1, capped at 150).</summary>
    public static int JarsForNextLevel(int level) => Math.Min(50 + level * 5, 150);

    /// <summary>Applies hearts to a jar/level state. Returns the new state and whether a level-up happened.</summary>
    public static (int Level, long JarHearts, int JarsCollected, int JarsForNext, bool LeveledUp) Apply(
        int level, long jarHearts, int jarsCollected, int jarsForNext, long jarTarget, long hearts)
    {
        var leveled = false;
        jarHearts += hearts;
        while (jarHearts >= jarTarget)
        {
            jarHearts -= jarTarget;
            jarsCollected++;
            if (jarsCollected >= jarsForNext)
            {
                jarsCollected -= jarsForNext;
                level++;
                jarsForNext = JarsForNextLevel(level);
                leveled = true;
            }
        }

        return (level, jarHearts, jarsCollected, jarsForNext, leveled);
    }
}
