using System.Buffers.Binary;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;

namespace Mehfil.Core.Voice;

/// <summary>
/// Agora AccessToken2 ("007") builder for RTC channels. Pure C# port of Agora's reference
/// implementation so the App Certificate never leaves the server.
/// </summary>
public static class AgoraTokenBuilder
{
    private const string Version = "007";
    private const ushort ServiceTypeRtc = 1;
    private const ushort PrivilegeJoinChannel = 1;
    private const ushort PrivilegePublishAudio = 2;
    private const ushort PrivilegePublishVideo = 3;
    private const ushort PrivilegePublishData = 4;

    public enum RtcRole
    {
        /// <summary>Can join and publish audio.</summary>
        Publisher = 1,

        /// <summary>Can only join (listener).</summary>
        Subscriber = 2,
    }

    public static string BuildRtcToken(
        string appId,
        string appCertificate,
        string channelName,
        uint uid,
        RtcRole role,
        int expireSeconds,
        DateTimeOffset? issuedAt = null,
        uint? salt = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(appId);
        ArgumentException.ThrowIfNullOrWhiteSpace(appCertificate);
        ArgumentException.ThrowIfNullOrWhiteSpace(channelName);

        var issueTs = (uint)(issuedAt ?? DateTimeOffset.UtcNow).ToUnixTimeSeconds();
        var expire = (uint)Math.Max(1, expireSeconds);
        var saltValue = salt ?? (uint)RandomNumberGenerator.GetInt32(1, int.MaxValue);

        var privileges = new SortedDictionary<ushort, uint> { [PrivilegeJoinChannel] = expire };
        if (role == RtcRole.Publisher)
        {
            privileges[PrivilegePublishAudio] = expire;
            privileges[PrivilegePublishVideo] = expire;
            privileges[PrivilegePublishData] = expire;
        }

        var uidText = uid == 0 ? "" : uid.ToString();

        using var signingInfo = new MemoryStream();
        PackString(signingInfo, appId);
        PackUInt32(signingInfo, issueTs);
        PackUInt32(signingInfo, expire);
        PackUInt32(signingInfo, saltValue);
        PackUInt16(signingInfo, 1); // service count

        // RTC service
        PackUInt16(signingInfo, ServiceTypeRtc);
        PackUInt16(signingInfo, (ushort)privileges.Count);
        foreach (var (key, value) in privileges)
        {
            PackUInt16(signingInfo, key);
            PackUInt32(signingInfo, value);
        }

        PackString(signingInfo, channelName);
        PackString(signingInfo, uidText);

        var info = signingInfo.ToArray();
        var signingKey = HMACSHA256.HashData(PackUInt32Bytes(saltValue), HMACSHA256.HashData(PackUInt32Bytes(issueTs), Encoding.UTF8.GetBytes(appCertificate)));
        var signature = HMACSHA256.HashData(signingKey, info);

        using var content = new MemoryStream();
        PackString(content, signature);
        content.Write(info);

        using var compressed = new MemoryStream();
        using (var zlib = new ZLibStream(compressed, CompressionLevel.Optimal, leaveOpen: true))
        {
            zlib.Write(content.ToArray());
        }

        return Version + Convert.ToBase64String(compressed.ToArray());
    }

    /// <summary>Parses the unsigned fields back out of a token (used by tests and diagnostics).</summary>
    public static (string AppId, uint IssueTs, uint Expire, uint Salt, string Channel, string Uid, IReadOnlyDictionary<ushort, uint> Privileges) Inspect(string token)
    {
        if (!token.StartsWith(Version, StringComparison.Ordinal))
        {
            throw new FormatException("Not an AccessToken2 token.");
        }

        var compressed = Convert.FromBase64String(token[Version.Length..]);
        using var input = new MemoryStream(compressed);
        using var zlib = new ZLibStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        zlib.CopyTo(output);
        var bytes = output.ToArray();
        var pos = 0;

        ReadBytes(bytes, ref pos); // signature
        var appId = Encoding.UTF8.GetString(ReadBytes(bytes, ref pos));
        var issueTs = ReadUInt32(bytes, ref pos);
        var expire = ReadUInt32(bytes, ref pos);
        var salt = ReadUInt32(bytes, ref pos);
        var serviceCount = ReadUInt16(bytes, ref pos);
        if (serviceCount != 1 || ReadUInt16(bytes, ref pos) != ServiceTypeRtc)
        {
            throw new FormatException("Unexpected service layout.");
        }

        var privilegeCount = ReadUInt16(bytes, ref pos);
        var privileges = new Dictionary<ushort, uint>();
        for (var i = 0; i < privilegeCount; i++)
        {
            privileges[ReadUInt16(bytes, ref pos)] = ReadUInt32(bytes, ref pos);
        }

        var channel = Encoding.UTF8.GetString(ReadBytes(bytes, ref pos));
        var uid = Encoding.UTF8.GetString(ReadBytes(bytes, ref pos));
        return (appId, issueTs, expire, salt, channel, uid, privileges);
    }

    private static void PackUInt16(Stream s, ushort value)
    {
        Span<byte> b = stackalloc byte[2];
        BinaryPrimitives.WriteUInt16LittleEndian(b, value);
        s.Write(b);
    }

    private static void PackUInt32(Stream s, uint value) => s.Write(PackUInt32Bytes(value));

    private static byte[] PackUInt32Bytes(uint value)
    {
        var b = new byte[4];
        BinaryPrimitives.WriteUInt32LittleEndian(b, value);
        return b;
    }

    private static void PackString(Stream s, string value) => PackString(s, Encoding.UTF8.GetBytes(value));

    private static void PackString(Stream s, byte[] value)
    {
        PackUInt16(s, (ushort)value.Length);
        s.Write(value);
    }

    private static ushort ReadUInt16(byte[] b, ref int pos)
    {
        var v = BinaryPrimitives.ReadUInt16LittleEndian(b.AsSpan(pos, 2));
        pos += 2;
        return v;
    }

    private static uint ReadUInt32(byte[] b, ref int pos)
    {
        var v = BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(pos, 4));
        pos += 4;
        return v;
    }

    private static byte[] ReadBytes(byte[] b, ref int pos)
    {
        var len = ReadUInt16(b, ref pos);
        var v = b.AsSpan(pos, len).ToArray();
        pos += len;
        return v;
    }
}
