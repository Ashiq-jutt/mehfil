using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Entities;

/// <summary>
/// Rotating refresh token. Only the SHA-256 hash is stored; the raw token lives on the device.
/// </summary>
public class RefreshToken : Entity
{
    public long UserId { get; set; }
    public required string TokenHash { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }

    /// <summary>Hash of the token that replaced this one (used for reuse detection).</summary>
    public string? ReplacedByTokenHash { get; set; }

    public string? CreatedByIp { get; set; }
    public string? DeviceName { get; set; }

    public User User { get; set; } = null!;

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;
}

/// <summary>FCM registration token for push notifications.</summary>
public class DeviceToken : Entity
{
    public long UserId { get; set; }
    public DevicePlatform Platform { get; set; }
    public required string FcmToken { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
