using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class ClubsController(IClubService clubs) : ApiControllerBase
{
    /// <summary>Explore / Hot feed, optionally filtered by country (omit or "GLOBAL" for all).</summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<ClubCardDto>>(StatusCodes.Status200OK)]
    public Task<PagedResult<ClubCardDto>> List(
        [FromQuery] ClubFeed feed = ClubFeed.Explore,
        [FromQuery] string? country = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken ct = default) =>
        clubs.ListAsync(feed, country, page, pageSize, CurrentUserId, ct);

    /// <summary>My tab: followed (own club first) or recently visited clubs.</summary>
    [HttpGet("my")]
    [ProducesResponseType<PagedResult<ClubCardDto>>(StatusCodes.Status200OK)]
    public Task<PagedResult<ClubCardDto>> Mine(
        [FromQuery] MyClubsFilter filter = MyClubsFilter.Followed,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken ct = default) =>
        clubs.ListMineAsync(filter, page, pageSize, CurrentUserId, ct);

    /// <summary>Top clubs by hearts for the podium banner.</summary>
    [HttpGet("top")]
    [ProducesResponseType<IReadOnlyList<ClubCardDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<ClubCardDto>> Top([FromQuery] int count = 3, CancellationToken ct = default) =>
        clubs.TopAsync(count, CurrentUserId, ct);

    /// <summary>"Enter a Club" lookup by the 8-digit id.</summary>
    [HttpGet("by-public-id/{publicId}")]
    [ProducesResponseType<ClubCardDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ClubCardDto> ByPublicId(string publicId, CancellationToken ct) =>
        clubs.FindByPublicIdAsync(publicId, CurrentUserId, ct);

    /// <summary>Create a club. Each user can own one active club.</summary>
    [HttpPost]
    [ProducesResponseType<ClubDetailDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClubDetailDto>> Create([FromBody] CreateClubRequest request, CancellationToken ct)
    {
        var club = await clubs.CreateAsync(CurrentUserId, request, ct);
        return CreatedAtAction(nameof(Get), new { publicId = club.Id }, club);
    }

    /// <summary>Club Info page data. Counts as a recent visit for non-owners.</summary>
    [HttpGet("{publicId}")]
    [ProducesResponseType<ClubDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ClubDetailDto> Get(string publicId, CancellationToken ct) => clubs.GetAsync(publicId, CurrentUserId, ct);

    /// <summary>Owner/admin: edit name, category, country, language, announcement.</summary>
    [HttpPatch("{publicId}")]
    [ProducesResponseType<ClubDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public Task<ClubDetailDto> Update(string publicId, [FromBody] UpdateClubRequest request, CancellationToken ct) =>
        clubs.UpdateAsync(publicId, CurrentUserId, request, ct);

    /// <summary>Owner/admin: upload the club cover (multipart "file", JPEG/PNG/WebP, max 5 MB).</summary>
    [HttpPost("{publicId}/cover")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [ProducesResponseType<ClubDetailDto>(StatusCodes.Status200OK)]
    public async Task<ClubDetailDto> UploadCover(string publicId, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            throw new BadRequestException("clubs.cover_empty", "Attach an image in the multipart field 'file'.");
        }

        await using var stream = file.OpenReadStream();
        return await clubs.SetCoverAsync(publicId, CurrentUserId, stream, ct);
    }

    [HttpPost("{publicId}/follow")]
    [ProducesResponseType<FollowResultDto>(StatusCodes.Status200OK)]
    public Task<FollowResultDto> Follow(string publicId, CancellationToken ct) => clubs.FollowAsync(publicId, CurrentUserId, ct);

    [HttpDelete("{publicId}/follow")]
    [ProducesResponseType<FollowResultDto>(StatusCodes.Status200OK)]
    public Task<FollowResultDto> Unfollow(string publicId, CancellationToken ct) => clubs.UnfollowAsync(publicId, CurrentUserId, ct);
}
