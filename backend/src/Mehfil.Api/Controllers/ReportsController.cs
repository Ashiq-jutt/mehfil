using Mehfil.Core.Moderation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class ReportsController(IReportService reports) : ApiControllerBase
{
    /// <summary>Report a user, club or message. One open report per reporter and target.</summary>
    [HttpPost]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<ReportDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReportDto>> Create([FromBody] CreateReportRequest request, CancellationToken ct)
    {
        var report = await reports.CreateAsync(CurrentUserId, request, ct);
        return StatusCode(StatusCodes.Status201Created, report);
    }
}
