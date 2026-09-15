using Mehfil.Core.Entities;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Users;

/// <summary>The signed-in user's own account (what GET /users/me returns).</summary>
public sealed record UserDto(
    string Id,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    string? Signature,
    string? CountryCode,
    Gender Gender,
    bool GenderLocked,
    byte? BirthDay,
    byte? BirthMonth,
    int Level,
    long HeartsBalance,
    long HeartsReceived,
    long HeartsGifted,
    long RoyaltyPoints,
    RoyalLevel RoyalLevel,
    RoyalLevel HighestRoyalLevel,
    PrimeLevel PrimeLevel,
    int RoyalStreakMonths,
    UserRole Role,
    DateTimeOffset CreatedAt);

/// <summary>Counters shown under "Achievements".</summary>
public sealed record AchievementsDto(
    int TopGifterTimes,
    int TopReceiverTimes,
    int CelebrityOfTheMonthTimes,
    int WeeklyTopClubTimes);

/// <summary>Numbers shown under "Mehfil Stats" and on the player card.</summary>
public sealed record StatsDto(
    int Level,
    long ActiveSeconds,
    int ClubsFollowed,
    int ClubsJoined,
    long GiftsSent,
    long GiftsReceived,
    int ProfileViews);

/// <summary>Own profile screen: account + achievements + stats.</summary>
public sealed record ProfileDto(
    UserDto User,
    string? CountryName,
    string? FlagEmoji,
    AchievementsDto Achievements,
    StatsDto Stats);

/// <summary>Another user's player card. No email, no spendable balance.</summary>
public sealed record PublicProfileDto(
    string Id,
    string DisplayName,
    string? AvatarUrl,
    string? Signature,
    string? CountryCode,
    string? CountryName,
    string? FlagEmoji,
    Gender Gender,
    int Level,
    long HeartsReceived,
    long HeartsGifted,
    RoyalLevel RoyalLevel,
    PrimeLevel PrimeLevel,
    bool IsOnline,
    AchievementsDto Achievements,
    StatsDto Stats,
    DateTimeOffset CreatedAt);

public sealed record UpdateProfileRequest(string? DisplayName, string? Signature, string? CountryCode);

/// <summary>Compact row for pickers (add admin, invite).</summary>
public sealed record UserSearchResultDto(string Id, string DisplayName, string? AvatarUrl, int Level, bool IsOnline);

public sealed record SetGenderRequest(Gender Gender);

public sealed record SetBirthdayRequest(int Day, int Month);

public static class UserMapper
{
    public static UserDto ToDto(this User u) => new(
        u.PublicId,
        u.DisplayName,
        u.Email,
        u.AvatarUrl,
        u.Signature,
        u.CountryCode,
        u.Gender,
        u.GenderLocked,
        u.BirthDay,
        u.BirthMonth,
        u.Level,
        u.HeartsBalance,
        u.HeartsReceived,
        u.HeartsGifted,
        u.RoyaltyPoints,
        u.RoyalLevel,
        u.HighestRoyalLevel,
        u.PrimeLevel,
        u.RoyalStreakMonths,
        u.Role,
        u.CreatedAt);
}

public interface IUserService
{
    Task<UserDto> GetMeAsync(long userId, CancellationToken ct);
    Task<ProfileDto> GetProfileAsync(long userId, CancellationToken ct);

    /// <summary>Player card for any user by public id. Counts a profile view when viewer != subject.</summary>
    Task<PublicProfileDto> GetPublicProfileAsync(string publicId, long viewerId, CancellationToken ct);

    Task<ProfileDto> UpdateProfileAsync(long userId, UpdateProfileRequest request, CancellationToken ct);

    /// <summary>Gender can be chosen exactly once; a second call returns 409.</summary>
    Task<ProfileDto> SetGenderAsync(long userId, Gender gender, CancellationToken ct);

    Task<ProfileDto> SetBirthdayAsync(long userId, int day, int month, CancellationToken ct);

    /// <summary>Stores an already client-resized image (JPEG/PNG/WebP, ≤ 5 MB) and returns the updated profile.</summary>
    Task<ProfileDto> SetAvatarAsync(long userId, Stream image, string? contentType, CancellationToken ct);

    /// <summary>Exact public id match first, then display-name prefix/contains matches. Excludes the caller.</summary>
    Task<IReadOnlyList<UserSearchResultDto>> SearchAsync(string query, long callerId, int limit, CancellationToken ct);
}
