using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Clubs;

public sealed record ClubMemberDto(
    string Id,
    string DisplayName,
    string? AvatarUrl,
    int Level,
    ClubRole Role,
    bool IsOnline,
    DateTimeOffset JoinedAt);

/// <summary>Owner first, then admins. Max is the cap shown as "ADMIN (n/7)".</summary>
public sealed record ClubAdminsDto(int Max, IReadOnlyList<ClubMemberDto> Admins);

public sealed record ClubRuleDto(string Title, string Text);

/// <summary>Community rules shown in the Club Info → Rules dialog. Static for now, served by the API so they can change without an app release.</summary>
public static class ClubRules
{
    public static readonly IReadOnlyList<ClubRuleDto> All =
    [
        new("NO OBSCENITY", "No vulgar content, nudity or sexual material of any kind."),
        new("NO PROPAGANDA", "No fake information, extremism, terrorism or abetting crimes."),
        new("NO BULLYING", "No insulting, abusing or harassing other users."),
        new("NO TRADE", "No selling, renting, sub-licensing or leasing of any part of Mehfil, including hearts, gifts and accounts."),
        new("BE KIND", "Please follow the rules or your club and account will be blocked. Owners and admins are responsible for their rooms."),
    ];
}

public interface IClubMembersService
{
    Task<PagedResult<ClubMemberDto>> ListMembersAsync(string clubPublicId, ClubRole? role, string? search, int? page, int? pageSize, CancellationToken ct);

    Task<ClubAdminsDto> ListAdminsAsync(string clubPublicId, string? search, CancellationToken ct);

    /// <summary>Owner only. Adds the user as a member when needed. 409 when the admin cap is reached.</summary>
    Task<ClubAdminsDto> PromoteAdminAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct);

    /// <summary>Owner only. Demotes an admin back to member.</summary>
    Task<ClubAdminsDto> DemoteAdminAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct);
}
