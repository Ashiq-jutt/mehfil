using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

/// <summary>Members and admins of a club (Club Info → Admins).</summary>
[Authorize]
[Route("api/v1/clubs/{publicId}")]
public sealed class ClubMembersController(IClubMembersService members) : ApiControllerBase
{
    [HttpGet("members")]
    [ProducesResponseType<PagedResult<ClubMemberDto>>(StatusCodes.Status200OK)]
    public Task<PagedResult<ClubMemberDto>> Members(
        string publicId,
        [FromQuery] ClubRole? role = null,
        [FromQuery] string? search = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken ct = default) =>
        members.ListMembersAsync(publicId, role, search, page, pageSize, ct);

    /// <summary>Owner first, then admins, with the cap ("ADMIN (n/7)").</summary>
    [HttpGet("admins")]
    [ProducesResponseType<ClubAdminsDto>(StatusCodes.Status200OK)]
    public Task<ClubAdminsDto> Admins(string publicId, [FromQuery] string? search = null, CancellationToken ct = default) =>
        members.ListAdminsAsync(publicId, search, ct);

    /// <summary>Owner only: make a user an admin (adds them as a member if needed).</summary>
    [HttpPut("admins/{userPublicId}")]
    [ProducesResponseType<ClubAdminsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<ClubAdminsDto> Promote(string publicId, string userPublicId, CancellationToken ct) =>
        members.PromoteAdminAsync(publicId, userPublicId, CurrentUserId, ct);

    /// <summary>Owner only: demote an admin to member.</summary>
    [HttpDelete("admins/{userPublicId}")]
    [ProducesResponseType<ClubAdminsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public Task<ClubAdminsDto> Demote(string publicId, string userPublicId, CancellationToken ct) =>
        members.DemoteAdminAsync(publicId, userPublicId, CurrentUserId, ct);
}
