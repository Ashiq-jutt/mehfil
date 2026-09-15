using Mehfil.Core.Options;
using Mehfil.Infrastructure.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Mehfil.Tests.Unit;

public sealed class JwtAccessTokenServiceTests
{
    private static readonly JwtOptions Options = new()
    {
        Secret = "unit-test-signing-key-0123456789abcdef-0123456789",
        Issuer = "mehfil-api",
        Audience = "mehfil-app",
        AccessTokenMinutes = 15,
    };

    [Fact]
    public async Task Create_ProducesTokenWithExpectedClaimsAndLifetime()
    {
        var now = new DateTimeOffset(2026, 9, 15, 10, 0, 0, TimeSpan.Zero);
        var service = new JwtAccessTokenService(Microsoft.Extensions.Options.Options.Create(Options), new FakeClock(now));

        var token = service.Create(42, "MOBI4875", "Mobile Developer", "User");

        Assert.Equal(now.AddMinutes(15), token.ExpiresAt);

        var result = await new JsonWebTokenHandler().ValidateTokenAsync(token.Token, new TokenValidationParameters
        {
            ValidIssuer = Options.Issuer,
            ValidAudience = Options.Audience,
            IssuerSigningKey = JwtAccessTokenService.SigningKey(Options.Secret),
            ValidateLifetime = false, // FakeClock is not the validator's clock
        });

        Assert.True(result.IsValid, result.Exception?.Message);
        Assert.Equal("42", result.Claims[JwtRegisteredClaimNames.Sub]);
        Assert.Equal("MOBI4875", result.Claims[JwtAccessTokenService.PublicIdClaim]);
        Assert.Equal("Mobile Developer", result.Claims[JwtRegisteredClaimNames.Name]);
        Assert.Equal("User", result.Claims["role"]);
    }

    [Fact]
    public async Task Create_TokenIsRejectedWithDifferentSecret()
    {
        var service = new JwtAccessTokenService(Microsoft.Extensions.Options.Options.Create(Options), new FakeClock(DateTimeOffset.UtcNow));
        var token = service.Create(1, "TEST0001", "Test", "User");

        var result = await new JsonWebTokenHandler().ValidateTokenAsync(token.Token, new TokenValidationParameters
        {
            ValidIssuer = Options.Issuer,
            ValidAudience = Options.Audience,
            IssuerSigningKey = JwtAccessTokenService.SigningKey("another-signing-key-0123456789abcdef-000000"),
        });

        Assert.False(result.IsValid);
    }
}
