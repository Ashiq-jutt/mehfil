using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Moderation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class BlocksController(IBlockService blocks) : ApiControllerBase
{
    /// <summary>Users the caller has blocked.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<BlockedUserDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<BlockedUserDto>> List(CancellationToken ct) => blocks.ListAsync(CurrentUserId, ct);

    /// <summary>Block a user by public id. Blocked users cannot exchange gifts with you and their messages are hidden in the app.</summary>
    [HttpPut("{userId}")]
    [ProducesResponseType<IReadOnlyList<BlockedUserDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<IReadOnlyList<BlockedUserDto>> Block(string userId, CancellationToken ct) => blocks.BlockAsync(CurrentUserId, userId, ct);

    [HttpDelete("{userId}")]
    [ProducesResponseType<IReadOnlyList<BlockedUserDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<BlockedUserDto>> Unblock(string userId, CancellationToken ct) => blocks.UnblockAsync(CurrentUserId, userId, ct);
}

/// <summary>Moderation queue. Requires the Admin or Moderator role (set on the user row; the JWT carries it as "role").</summary>
[Authorize(Roles = "Admin,Moderator")]
[Route("api/v1/admin/reports")]
public sealed class AdminReportsController(IReportService reports) : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AdminReportDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<PagedResult<AdminReportDto>> List([FromQuery] ReportStatus? status = null, [FromQuery] int? page = null, [FromQuery] int? pageSize = null, CancellationToken ct = default) =>
        reports.ListForAdminAsync(status, page, pageSize, ct);

    /// <summary>Close a report; an action (suspend_user, ban_user, deactivate_club, delete_message) also enforces it.</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType<AdminReportDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<AdminReportDto> Resolve(long id, [FromBody] ResolveReportRequest request, CancellationToken ct) =>
        reports.ResolveAsync(CurrentUserId, id, request, ct);
}
