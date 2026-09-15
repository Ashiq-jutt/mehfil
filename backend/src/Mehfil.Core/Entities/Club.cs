using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Entities;

/// <summary>A club = one live voice room with up to 10 seats, its own level, jar and leaderboard score.</summary>
public class Club : AuditableEntity
{
    public const int SeatCount = 10;

    /// <summary>8-digit human-facing id shown in the room header and used for "Enter a Club".</summary>
    public required string PublicId { get; set; }

    public required string Name { get; set; }
    public string? CoverUrl { get; set; }
    public string? CountryCode { get; set; }
    public long CategoryId { get; set; }
    public string Language { get; set; } = "English";
    public long OwnerId { get; set; }
    public string? Announcement { get; set; }

    public int Level { get; set; } = 1;

    /// <summary>Hearts collected in the daily jar; resets at JarResetsAt.</summary>
    public long JarHearts { get; set; }

    public long JarTarget { get; set; } = 500;
    public DateTimeOffset JarResetsAt { get; set; }

    /// <summary>Jars collected toward the next level.</summary>
    public int JarsCollected { get; set; }

    public int JarsForNextLevel { get; set; } = 150;

    /// <summary>Lifetime hearts gifted inside this club (Top Clubs score).</summary>
    public long TotalHearts { get; set; }

    public int MemberCount { get; set; }
    public int FollowerCount { get; set; }
    public int OnlineCount { get; set; }
    public long ActiveSeconds { get; set; }
    public int WeeklyTopClubCount { get; set; }
    public bool IsActive { get; set; } = true;

    public long? BackgroundItemId { get; set; }
    public long? DpItemId { get; set; }

    public byte[] RowVersion { get; set; } = [];

    public Country? Country { get; set; }
    public ClubCategory Category { get; set; } = null!;
    public User Owner { get; set; } = null!;
    public StoreItem? BackgroundItem { get; set; }
    public StoreItem? DpItem { get; set; }
    public ICollection<ClubMember> Members { get; set; } = new List<ClubMember>();
    public ICollection<ClubSeat> Seats { get; set; } = new List<ClubSeat>();
    public ICollection<ClubFollow> Followers { get; set; } = new List<ClubFollow>();
    public ICollection<ClubItem> Items { get; set; } = new List<ClubItem>();
}

public class ClubMember
{
    public long ClubId { get; set; }
    public long UserId { get; set; }
    public ClubRole Role { get; set; } = ClubRole.Member;
    public DateTimeOffset JoinedAt { get; set; }
    public DateTimeOffset? LastActiveAt { get; set; }

    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class ClubFollow
{
    public long ClubId { get; set; }
    public long UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;
}

/// <summary>Drives the "My → Recents" tab.</summary>
public class ClubVisit
{
    public long ClubId { get; set; }
    public long UserId { get; set; }
    public DateTimeOffset LastVisitedAt { get; set; }

    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;
}

/// <summary>One of the 10 voice seats in a club room.</summary>
public class ClubSeat
{
    public long ClubId { get; set; }
    public byte SeatIndex { get; set; }
    public long? UserId { get; set; }
    public bool IsLocked { get; set; }
    public bool IsMuted { get; set; }
    public DateTimeOffset? TakenAt { get; set; }

    public Club Club { get; set; } = null!;
    public User? User { get; set; }
}

public class ClubBan : Entity
{
    public long ClubId { get; set; }
    public long UserId { get; set; }
    public long ByUserId { get; set; }
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public Club Club { get; set; } = null!;
    public User User { get; set; } = null!;
    public User ByUser { get; set; } = null!;
}

public class ClubMessage : Entity
{
    public long ClubId { get; set; }
    public long? SenderId { get; set; }
    public MessageType Type { get; set; } = MessageType.Text;
    public required string Text { get; set; }
    public long? GiftTransactionId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public long? DeletedByUserId { get; set; }

    public Club Club { get; set; } = null!;
    public User? Sender { get; set; }
}

/// <summary>A cosmetic owned by a club (backgrounds, club DPs).</summary>
public class ClubItem
{
    public long ClubId { get; set; }
    public long ItemId { get; set; }
    public DateTimeOffset AcquiredAt { get; set; }
    public bool IsEquipped { get; set; }

    public Club Club { get; set; } = null!;
    public StoreItem Item { get; set; } = null!;
}
