using Mehfil.Infrastructure.Auth;

namespace Mehfil.Tests.Unit;

public sealed class RefreshTokensTests
{
    [Fact]
    public void GenerateRaw_ProducesUrlSafeUniqueTokens()
    {
        var a = RefreshTokens.GenerateRaw();
        var b = RefreshTokens.GenerateRaw();

        Assert.NotEqual(a, b);
        Assert.DoesNotContain('+', a);
        Assert.DoesNotContain('/', a);
        Assert.DoesNotContain('=', a);
        Assert.InRange(a.Length, 60, 70);
    }

    [Fact]
    public void Hash_IsDeterministicAndDoesNotRevealToken()
    {
        var raw = RefreshTokens.GenerateRaw();

        var h1 = RefreshTokens.Hash(raw);
        var h2 = RefreshTokens.Hash(raw);

        Assert.Equal(h1, h2);
        Assert.NotEqual(raw, h1);
        Assert.Equal(44, h1.Length); // base64 of 32 bytes
        Assert.NotEqual(h1, RefreshTokens.Hash(raw + "x"));
    }
}
