namespace Mehfil.Core.Enums;

public enum Gender : byte
{
    Unspecified = 0,
    Male = 1,
    Female = 2,
    Undisclosed = 3,
}

public enum UserStatus : byte
{
    Active = 0,
    Suspended = 1,
    Banned = 2,
}

public enum UserRole : byte
{
    User = 0,
    Moderator = 1,
    Admin = 2,
}

/// <summary>Royalty tiers shown on the profile (R1 lowest → R6 highest). R0 = none.</summary>
public enum RoyalLevel : byte
{
    None = 0,
    R1 = 1,
    R2 = 2,
    R3 = 3,
    R4 = 4,
    R5 = 5,
    R6 = 6,
}

/// <summary>Prime tiers above Royalty (P1 → P3). P0 = none.</summary>
public enum PrimeLevel : byte
{
    None = 0,
    P1 = 1,
    P2 = 2,
    P3 = 3,
}

public enum DevicePlatform : byte
{
    Android = 1,
    Ios = 2,
}

public enum ClubRole : byte
{
    Member = 0,
    Admin = 1,
    Owner = 2,
}

public enum MessageType : byte
{
    Text = 0,
    System = 1,
    Gift = 2,
}

public enum PurchaseStatus : byte
{
    Pending = 0,
    Verified = 1,
    Rejected = 2,
    Refunded = 3,
}

public enum LedgerReason : byte
{
    Purchase = 0,
    GiftSent = 1,
    Reward = 2,
    AdminAdjustment = 3,
    WelcomeBonus = 4,
    Refund = 5,
}

public enum StoreItemKind : byte
{
    Frame = 0,
    ChatBubble = 1,
    EntryStyle = 2,
    Background = 3,
    Card = 4,
    ClubDp = 5,
}

public enum UnlockRule : byte
{
    Default = 0,
    Leaderboard = 1,
    RoyalLevel = 2,
    PrimeLevel = 3,
    ClubLevel = 4,
    Purchase = 5,
}

public enum LeaderboardBoard : byte
{
    TopClubs = 0,
    TopGifters = 1,
    TopReceivers = 2,
}

public enum LeaderboardPeriod : byte
{
    Daily = 0,
    Weekly = 1,
}

public enum AchievementKind : byte
{
    TopGifter = 0,
    TopReceiver = 1,
    CelebrityOfTheMonth = 2,
    WeeklyTopClub = 3,
}

public enum ReportTargetType : byte
{
    User = 0,
    Club = 1,
    Message = 2,
}

public enum ReportStatus : byte
{
    Open = 0,
    Reviewed = 1,
    ActionTaken = 2,
    Dismissed = 3,
}

public enum NotificationType : byte
{
    System = 0,
    ClubFollowed = 1,
    GiftReceived = 2,
    LeaderboardReward = 3,
    ClubInvite = 4,
    AdminGranted = 5,
    Kicked = 6,
    Banned = 7,
}
