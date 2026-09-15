namespace Mehfil.Core.Voice;

public sealed class AgoraOptions
{
    public const string SectionName = "Agora";

    /// <summary>Public App ID (also configured in the mobile app).</summary>
    public string AppId { get; set; } = "";

    /// <summary>Primary App Certificate. Server-side only; never ships in the app.</summary>
    public string AppCertificate { get; set; } = "";

    public int TokenMinutes { get; set; } = 60;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(AppId) && !string.IsNullOrWhiteSpace(AppCertificate);
}

/// <summary>What the app needs to join the club's Agora channel. Channel name = club public id.</summary>
public sealed record VoiceTokenDto(string AppId, string Channel, uint Uid, string Token, DateTimeOffset ExpiresAt, bool CanPublish);

public interface IVoiceService
{
    /// <summary>Issues a short-lived RTC token for the room the caller is currently in. Publisher rights when seated.</summary>
    Task<VoiceTokenDto> IssueTokenAsync(string clubPublicId, long userId, CancellationToken ct);
}
