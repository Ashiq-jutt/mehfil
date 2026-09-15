using Mehfil.Core.Users;

namespace Mehfil.Core.Auth;

// ---- Requests -------------------------------------------------------------

public sealed record GoogleLoginRequest(string IdToken, string? DeviceName);

public sealed record RefreshRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

/// <summary>Development-only login (see DevLoginOptions).</summary>
public sealed record DevLoginRequest(string Email, string? DisplayName, string? DeviceName);

// ---- Responses ------------------------------------------------------------

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    UserDto User,
    bool IsNewUser);

// ---- Internal contracts ---------------------------------------------------

/// <summary>Identity asserted by a verified Google ID token.</summary>
public sealed record GoogleUserInfo(string Subject, string Email, bool EmailVerified, string? Name, string? Picture);

public sealed record AccessToken(string Token, DateTimeOffset ExpiresAt);

public sealed record AuthContext(string? IpAddress, string? DeviceName);

public interface IGoogleTokenValidator
{
    /// <summary>Validates signature, expiry and audience. Throws UnauthorizedException on failure.</summary>
    Task<GoogleUserInfo> ValidateAsync(string idToken, CancellationToken ct);
}

public interface IAccessTokenService
{
    AccessToken Create(long userId, string publicId, string displayName, string role);
}

public interface IAuthService
{
    Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, AuthContext context, CancellationToken ct);
    Task<AuthResponse> LoginDevAsync(DevLoginRequest request, AuthContext context, CancellationToken ct);
    Task<AuthResponse> RefreshAsync(string refreshToken, AuthContext context, CancellationToken ct);
    Task LogoutAsync(string refreshToken, CancellationToken ct);
}
