using Mehfil.Core.Entities;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Users;

/// <summary>The signed-in user's own profile (what GET /users/me returns).</summary>
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
}
