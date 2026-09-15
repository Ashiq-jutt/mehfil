using Mehfil.Core.Enums;
using Mehfil.Core.Leaderboards;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class LeaderboardController(ILeaderboardService leaderboard) : ApiControllerBase
{
    /// <summary>Store items won at ranks #1–#3 of each board ("Rewards" modal).</summary>
    [HttpGet("rewards")]
    [ProducesResponseType<LeaderboardRewardsDto>(StatusCodes.Status200OK)]
    public Task<LeaderboardRewardsDto> Rewards(CancellationToken ct) => leaderboard.GetRewardsAsync(ct);

    /// <summary>
    /// Previous (frozen) and current (live) rankings for a board. Period defaults to Weekly;
    /// Top Gifters / Top Receivers also support Daily.
    /// </summary>
    [HttpGet("{board}")]
    [ProducesResponseType<LeaderboardDto>(StatusCodes.Status200OK)]
    public Task<LeaderboardDto> Get(LeaderboardBoard board, [FromQuery] LeaderboardPeriod period = LeaderboardPeriod.Weekly, CancellationToken ct = default) =>
        leaderboard.GetAsync(CurrentUserId, board, period, ct);
}
