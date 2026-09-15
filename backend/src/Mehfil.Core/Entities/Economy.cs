using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Entities;

/// <summary>A gift sent inside a club. Source of truth for leaderboards and the club jar.</summary>
public class GiftTransaction : Entity
{
    public long ClubId { get; set; }
    public long SenderId { get; set; }
    public long? ReceiverId { get; set; }
    public long GiftId { get; set; }
    public int Quantity { get; set; } = 1;

    /// <summary>Total hearts spent (unit price × quantity at the time of sending).</summary>
    public long Hearts { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Club Club { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public User? Receiver { get; set; }
    public Gift Gift { get; set; } = null!;
}

/// <summary>A store (Google Play / App Store) purchase of a hearts package.</summary>
public class Purchase : Entity
{
    public long UserId { get; set; }
    public long PackageId { get; set; }
    public DevicePlatform Platform { get; set; }
    public required string StoreTransactionId { get; set; }
    public PurchaseStatus Status { get; set; } = PurchaseStatus.Pending;
    public long HeartsGranted { get; set; }
    public string? RawReceipt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? VerifiedAt { get; set; }

    public User User { get; set; } = null!;
    public HeartsPackage Package { get; set; } = null!;
}

/// <summary>Append-only ledger. Every change to User.HeartsBalance has exactly one row here.</summary>
public class WalletLedger : Entity
{
    public long UserId { get; set; }
    public long Delta { get; set; }
    public long BalanceAfter { get; set; }
    public LedgerReason Reason { get; set; }

    /// <summary>Id of the Purchase / GiftTransaction / LeaderboardSnapshot that caused this entry.</summary>
    public long? ReferenceId { get; set; }

    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
}

/// <summary>A cosmetic owned by a user.</summary>
public class UserItem
{
    public long UserId { get; set; }
    public long ItemId { get; set; }
    public DateTimeOffset AcquiredAt { get; set; }
    public bool IsEquipped { get; set; }

    public User User { get; set; } = null!;
    public StoreItem Item { get; set; } = null!;
}

/// <summary>Frozen leaderboard row for a finished period (yesterday / last week). Rewards are granted when written.</summary>
public class LeaderboardSnapshot : Entity
{
    public LeaderboardBoard Board { get; set; }
    public LeaderboardPeriod Period { get; set; }
    public DateOnly PeriodStart { get; set; }
    public int Rank { get; set; }

    /// <summary>Club id (TopClubs) or user id (TopGifters / TopReceivers).</summary>
    public long SubjectId { get; set; }

    public long Score { get; set; }
    public long? RewardItemId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public StoreItem? RewardItem { get; set; }
}

/// <summary>Counters shown under "Achievements" on the profile (Top Gifter ×N, etc.).</summary>
public class Achievement
{
    public long UserId { get; set; }
    public AchievementKind Kind { get; set; }
    public int Count { get; set; }
    public DateTimeOffset? LastAt { get; set; }

    public User User { get; set; } = null!;
}
