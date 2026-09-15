using System.Security.Claims;
using Mehfil.Core.Common;
using Mehfil.Infrastructure.Auth;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Mehfil.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Internal user id from the "sub" claim. Throws 401 if the principal is not one of ours.</summary>
    public static long GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return long.TryParse(sub, out var id)
            ? id
            : throw new UnauthorizedException("auth.invalid_token", "The access token has no user id.");
    }

    public static string? GetPublicId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(JwtAccessTokenService.PublicIdClaim);
}
