using Mehfil.Core.Common;
using Mehfil.Core.Voice;
using Mehfil.Infrastructure.Data;
using Mehfil.Infrastructure.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Voice;

public sealed class VoiceService(MehfilDbContext db, RoomRegistry registry, IOptions<AgoraOptions> options, IClock clock) : IVoiceService
{
    public async Task<VoiceTokenDto> IssueTokenAsync(string clubPublicId, long userId, CancellationToken ct)
    {
        var agora = options.Value;
        if (!agora.IsConfigured)
        {
            throw new AppUnavailableException("voice.not_configured", "Voice is not configured on this server (Agora:AppId / Agora:AppCertificate).");
        }

        var club = await db.Clubs.AsNoTracking().Where(c => c.PublicId == clubPublicId.Trim() && c.IsActive)
                       .Select(c => new { c.Id, c.PublicId }).FirstOrDefaultAsync(ct)
                   ?? throw NotFoundException.For("Club", clubPublicId);

        if (registry.GetUserRoom(userId) != club.Id)
        {
            throw new BadRequestException("room.not_in_room", "Join the club room first.");
        }

        // Everyone gets publish rights in the token; whether audio is actually published is enforced by seat + mute
        // state on the hub, and the token lifetime is short. This avoids a token round-trip on every seat change.
        var now = clock.UtcNow;
        var seconds = Math.Clamp(agora.TokenMinutes, 5, 24 * 60) * 60;
        var uid = checked((uint)userId);
        var token = AgoraTokenBuilder.BuildRtcToken(agora.AppId, agora.AppCertificate, club.PublicId, uid, AgoraTokenBuilder.RtcRole.Publisher, seconds, now);

        return new VoiceTokenDto(agora.AppId, club.PublicId, uid, token, now.AddSeconds(seconds), true);
    }
}
