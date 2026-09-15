using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Clubs;

public enum ClubFeed
{
    Explore,
    Hot,
}

public enum MyClubsFilter
{
    Followed,
    Recents,
}

/// <summary>Grid card on Clubs Home.</summary>
public sealed record ClubCardDto(
    string Id,
    string Name,
    string? CoverUrl,
    string? CountryCode,
    string? FlagEmoji,
    string CategoryCode,
    string CategoryName,
    int Level,
    int OnlineCount,
    int MemberCount,
    int FollowerCount,
    long TotalHearts,
    bool IsLive,
    bool IsFollowing,
    bool IsMine);

public sealed record ClubOwnerDto(string Id, string DisplayName, string? AvatarUrl, int Level);

/// <summary>Club Info page + room header.</summary>
public sealed record ClubDetailDto(
    string Id,
    string Name,
    string? CoverUrl,
    string? CountryCode,
    string? CountryName,
    string? FlagEmoji,
    long CategoryId,
    string CategoryCode,
    string CategoryName,
    string Language,
    string? Announcement,
    ClubOwnerDto Owner,
    int AdminCount,
    int MemberCount,
    int FollowerCount,
    int OnlineCount,
    int Level,
    long JarHearts,
    long JarTarget,
    DateTimeOffset JarResetsAt,
    int JarsCollected,
    int JarsForNextLevel,
    long TotalHearts,
    int WeeklyTopClubCount,
    long ActiveSeconds,
    bool IsLive,
    bool IsFollowing,
    ClubRole? MyRole,
    DateTimeOffset CreatedAt);

public sealed record CreateClubRequest(
    string Name,
    long CategoryId,
    string? CountryCode,
    string? Language,
    string? Announcement);

public sealed record UpdateClubRequest(
    string? Name,
    long? CategoryId,
    string? CountryCode,
    string? Language,
    string? Announcement);

public sealed record FollowResultDto(bool IsFollowing, int FollowerCount);

public interface IClubService
{
    Task<PagedResult<ClubCardDto>> ListAsync(ClubFeed feed, string? countryCode, int? page, int? pageSize, long userId, CancellationToken ct);

    /// <summary>Followed: the user's own club first, then followed clubs. Recents: last visited first.</summary>
    Task<PagedResult<ClubCardDto>> ListMineAsync(MyClubsFilter filter, int? page, int? pageSize, long userId, CancellationToken ct);

    Task<IReadOnlyList<ClubCardDto>> TopAsync(int count, long userId, CancellationToken ct);

    Task<ClubCardDto> FindByPublicIdAsync(string publicId, long userId, CancellationToken ct);

    /// <summary>Full detail; records a "recent" visit for non-owners.</summary>
    Task<ClubDetailDto> GetAsync(string publicId, long userId, CancellationToken ct);

    Task<ClubDetailDto> CreateAsync(long ownerId, CreateClubRequest request, CancellationToken ct);

    Task<ClubDetailDto> UpdateAsync(string publicId, long userId, UpdateClubRequest request, CancellationToken ct);

    Task<ClubDetailDto> SetCoverAsync(string publicId, long userId, Stream image, CancellationToken ct);

    Task<FollowResultDto> FollowAsync(string publicId, long userId, CancellationToken ct);

    Task<FollowResultDto> UnfollowAsync(string publicId, long userId, CancellationToken ct);
}
