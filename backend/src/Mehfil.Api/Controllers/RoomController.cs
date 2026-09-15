using Mehfil.Core.Rooms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

/// <summary>
/// Room actions over REST. Presence, chat send and mic state go through the SignalR hub;
/// everything here broadcasts its result to the room as well.
/// </summary>
[Authorize]
[Route("api/v1/clubs/{publicId}/room")]
public sealed class RoomController(IRoomService rooms) : ApiControllerBase
{
    /// <summary>Current room snapshot (used after reconnects and by Swagger testing).</summary>
    [HttpGet("state")]
    [ProducesResponseType<RoomStateDto>(StatusCodes.Status200OK)]
    public Task<RoomStateDto> State(string publicId, CancellationToken ct) => rooms.GetStateAsync(publicId, CurrentUserId, ct);

    /// <summary>Chat history, oldest first. Pass the smallest id you have as "before" to page back.</summary>
    [HttpGet("messages")]
    [ProducesResponseType<IReadOnlyList<ClubMessageDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<ClubMessageDto>> Messages(string publicId, [FromQuery] long? before = null, [FromQuery] int limit = 30, CancellationToken ct = default) =>
        rooms.GetMessagesAsync(publicId, before, limit, ct);

    /// <summary>Author, admin or owner: hide a message.</summary>
    [HttpDelete("messages/{messageId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteMessage(string publicId, long messageId, CancellationToken ct)
    {
        await rooms.DeleteMessageAsync(publicId, messageId, CurrentUserId, ct);
        return NoContent();
    }

    [HttpPut("announcement")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetAnnouncement(string publicId, [FromBody] SetAnnouncementRequest request, CancellationToken ct)
    {
        await rooms.SetAnnouncementAsync(publicId, CurrentUserId, request.Text, ct);
        return NoContent();
    }

    [HttpPost("seats/{index:int}/take")]
    [ProducesResponseType<SeatDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<SeatDto> TakeSeat(string publicId, int index, CancellationToken ct) => rooms.TakeSeatAsync(publicId, index, CurrentUserId, ct);

    [HttpPost("seats/leave")]
    [ProducesResponseType<SeatDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LeaveSeat(string publicId, CancellationToken ct)
    {
        var seat = await rooms.LeaveSeatAsync(publicId, CurrentUserId, ct);
        return seat is null ? NoContent() : Ok(seat);
    }

    [HttpPost("seats/{index:int}/lock")]
    [ProducesResponseType<SeatDto>(StatusCodes.Status200OK)]
    public Task<SeatDto> LockSeat(string publicId, int index, [FromBody] LockSeatRequest request, CancellationToken ct) =>
        rooms.LockSeatAsync(publicId, index, request.Locked, CurrentUserId, ct);

    [HttpPost("seats/{index:int}/mute")]
    [ProducesResponseType<SeatDto>(StatusCodes.Status200OK)]
    public Task<SeatDto> MuteSeat(string publicId, int index, [FromBody] MuteSeatRequest request, CancellationToken ct) =>
        rooms.MuteSeatAsync(publicId, index, request.Muted, CurrentUserId, ct);

    [HttpPost("seats/{index:int}/kick")]
    [ProducesResponseType<SeatDto>(StatusCodes.Status200OK)]
    public Task<SeatDto> KickFromSeat(string publicId, int index, CancellationToken ct) => rooms.KickFromSeatAsync(publicId, index, CurrentUserId, ct);

    [HttpPost("kick/{userPublicId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Kick(string publicId, string userPublicId, CancellationToken ct)
    {
        await rooms.KickUserAsync(publicId, userPublicId, CurrentUserId, ct);
        return NoContent();
    }

    [HttpPost("bans/{userPublicId}")]
    [ProducesResponseType<ClubBanDto>(StatusCodes.Status200OK)]
    public Task<ClubBanDto> Ban(string publicId, string userPublicId, [FromBody] BanRequest? request, CancellationToken ct) =>
        rooms.BanUserAsync(publicId, userPublicId, request?.Reason, CurrentUserId, ct);

    [HttpDelete("bans/{userPublicId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unban(string publicId, string userPublicId, CancellationToken ct)
    {
        await rooms.UnbanUserAsync(publicId, userPublicId, CurrentUserId, ct);
        return NoContent();
    }

    [HttpGet("bans")]
    [ProducesResponseType<IReadOnlyList<ClubBanDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<ClubBanDto>> Bans(string publicId, CancellationToken ct) => rooms.ListBansAsync(publicId, CurrentUserId, ct);
}
