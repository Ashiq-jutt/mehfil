using Google.Apis.Auth;
using Mehfil.Core.Auth;
using Mehfil.Core.Common;
using Mehfil.Core.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Auth;

/// <summary>Verifies Google ID tokens (signature, issuer, expiry, audience) using Google's public keys.</summary>
public sealed class GoogleTokenValidator(IOptions<GoogleAuthOptions> options, ILogger<GoogleTokenValidator> logger)
    : IGoogleTokenValidator
{
    public async Task<GoogleUserInfo> ValidateAsync(string idToken, CancellationToken ct)
    {
        var clientIds = options.Value.ClientIds;
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = clientIds.Length > 0 ? clientIds : null,
        };

        if (clientIds.Length == 0)
        {
            logger.LogWarning("Google:ClientIds is empty; ID token audience is not being validated");
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            logger.LogInformation("Rejected Google ID token: {Reason}", ex.Message);
            throw new UnauthorizedException("auth.invalid_google_token", "The Google sign-in token is invalid or expired.");
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
        {
            throw new UnauthorizedException("auth.email_required", "The Google account has no email address.");
        }

        return new GoogleUserInfo(payload.Subject, payload.Email, payload.EmailVerified, payload.Name, payload.Picture);
    }
}
