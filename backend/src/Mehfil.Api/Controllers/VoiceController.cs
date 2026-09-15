using Mehfil.Core.Voice;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
[Route("api/v1/clubs/{publicId}/room")]
public sealed class VoiceController(IVoiceService voice) : ApiControllerBase
{
    /// <summary>Agora RTC token for the room you are in. Call again before ExpiresAt (the SDK warns 30 s ahead).</summary>
    [HttpPost("voice-token")]
    [ProducesResponseType<VoiceTokenDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public Task<VoiceTokenDto> Token(string publicId, CancellationToken ct) => voice.IssueTokenAsync(publicId, CurrentUserId, ct);
}
