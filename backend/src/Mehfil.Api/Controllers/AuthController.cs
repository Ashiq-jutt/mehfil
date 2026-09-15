using Mehfil.Api.Extensions;
using Mehfil.Core.Auth;
using Mehfil.Core.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Mehfil.Api.Controllers;

[AllowAnonymous]
[EnableRateLimiting(ServiceCollectionExtensions.AuthRateLimitPolicy)]
public sealed class AuthController(IAuthService auth) : ApiControllerBase
{
    /// <summary>Sign in with a Google ID token obtained on the device. Creates the profile on first login.</summary>
    [HttpPost("google")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public Task<AuthResponse> Google([FromBody] GoogleLoginRequest request, CancellationToken ct) =>
        auth.LoginWithGoogleAsync(request, CurrentAuthContext(request.DeviceName), ct);

    /// <summary>Exchange a refresh token for a new access + refresh token pair (rotation).</summary>
    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public Task<AuthResponse> Refresh([FromBody] RefreshRequest request, CancellationToken ct) =>
        auth.RefreshAsync(request.RefreshToken, CurrentAuthContext(), ct);

    /// <summary>Revoke a refresh token. Idempotent.</summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken ct)
    {
        await auth.LogoutAsync(request.RefreshToken, ct);
        return NoContent();
    }

    /// <summary>
    /// Development only: sign in as any email without Google. Returns 404 unless
    /// DevLogin:Enabled is true and the environment is Development.
    /// </summary>
    [HttpPost("dev")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<AuthResponse> Dev(
        [FromBody] DevLoginRequest request,
        [FromServices] IOptions<DevLoginOptions> options,
        CancellationToken ct)
    {
        _ = options; // the service performs the environment + flag check and throws 404 otherwise
        return auth.LoginDevAsync(request, CurrentAuthContext(request.DeviceName), ct);
    }
}
