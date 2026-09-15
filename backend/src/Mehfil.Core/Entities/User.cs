using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Entities;

public class User : AuditableEntity
{
    /// <summary>Human-facing id shown on the profile (e.g. "MOBI4875"). Unique.</summary>
    public required string PublicId { get; set; }

    /// <summary>Google account subject ("sub" claim). Dev logins use "dev:{email}".</summary>
    public required string GoogleSubject { get; set; }

    public required string Email { get; set; }
    public required string DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Signature { get; set; }
    public string? CountryCode { get; set; }

    public Gender Gender { get; set; } = Gender.Unspecified;

    /// <summary>Gender can be set only once (matches the reference design).</summary>
    public bool GenderLocked { get; set; }

    public byte? BirthDay { get; set; }
    public byte? BirthMonth { get; set; }

    public int Level { get; set; } = 1;
    public long Xp { get; set; }

    /// <summary>Spendable hearts. Only ever changed together with a WalletLedger row.</summary>
    public long HeartsBalance { get; set; }

    /// <summary>Lifetime hearts received as gifts (leaderboard score, not spendable).</summary>
    public long HeartsReceived { get; set; }

    /// <summary>Lifetime hearts spent on gifts (leaderboard score).</summary>
    public long HeartsGifted { get; set; }

    public long RoyaltyPoints { get; set; }
    public RoyalLevel RoyalLevel { get; set; } = RoyalLevel.None;
    public RoyalLevel HighestRoyalLevel { get; set; } = RoyalLevel.None;
    public PrimeLevel PrimeLevel { get; set; } = PrimeLevel.None;
    public int RoyalStreakMonths { get; set; }

    public bool IsOnline { get; set; }
    public DateTimeOffset? LastSeenAt { get; set; }

    public UserStatus Status { get; set; } = UserStatus.Active;
    public UserRole Role { get; set; } = UserRole.User;

    /// <summary>Optimistic concurrency token (SQL Server rowversion).</summary>
    public byte[] RowVersion { get; set; } = [];

    public Country? Country { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<DeviceToken> DeviceTokens { get; set; } = new List<DeviceToken>();
    public ICollection<ClubMember> Memberships { get; set; } = new List<ClubMember>();
    public ICollection<ClubFollow> Follows { get; set; } = new List<ClubFollow>();
    public ICollection<UserItem> Items { get; set; } = new List<UserItem>();
    public ICollection<Achievement> Achievements { get; set; } = new List<Achievement>();
}
