using Mehfil.Core.Royalty;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class RoyaltyController(IRoyaltyService royalty) : ApiControllerBase
{
    /// <summary>Royal (R1–R6) and Prime (P1–P3) tiers with the caller's points and progress.</summary>
    [HttpGet]
    [ProducesResponseType<RoyaltyDto>(StatusCodes.Status200OK)]
    public Task<RoyaltyDto> Get(CancellationToken ct) => royalty.GetAsync(CurrentUserId, ct);
}
