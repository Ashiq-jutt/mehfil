using System.Security.Cryptography;
using System.Text;

namespace Mehfil.Infrastructure.Auth;

/// <summary>Opaque refresh token generation and hashing. Raw tokens are never stored.</summary>
public static class RefreshTokens
{
    private const int RawBytes = 48;

    public static string GenerateRaw()
    {
        var bytes = RandomNumberGenerator.GetBytes(RawBytes);
        return Base64UrlEncode(bytes);
    }

    public static string Hash(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToBase64String(hash);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

/// <summary>Human-facing ids. Uniqueness is enforced by the caller (unique index + retry).</summary>
public static class PublicIds
{
    private const string Letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /// <summary>"MOBI4875" style: first 4 latin letters of the name (random letters if fewer) + 4 digits.</summary>
    public static string ForUser(string displayName)
    {
        var prefix = new string(displayName
            .ToUpperInvariant()
            .Where(c => c is >= 'A' and <= 'Z')
            .Take(4)
            .ToArray());

        while (prefix.Length < 4)
        {
            prefix += Letters[RandomNumberGenerator.GetInt32(Letters.Length)];
        }

        return prefix + RandomNumberGenerator.GetInt32(0, 10_000).ToString("D4");
    }

    /// <summary>8 digits, never starting with zero (e.g. "29451765").</summary>
    public static string ForClub() =>
        RandomNumberGenerator.GetInt32(10_000_000, 100_000_000).ToString("D8");
}
