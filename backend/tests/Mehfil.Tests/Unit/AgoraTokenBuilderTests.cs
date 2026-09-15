using Mehfil.Core.Voice;

namespace Mehfil.Tests.Unit;

public sealed class AgoraTokenBuilderTests
{
    private const string AppId = "970CA35de60c44645bbae8a215061b33";
    private const string AppCert = "5CFd2fd1755d40ecb72977518be15d3b";

    [Fact]
    public void BuildRtcToken_ProducesVersion007_ThatRoundTrips()
    {
        var issued = DateTimeOffset.FromUnixTimeSeconds(1_111_111);

        var token = AgoraTokenBuilder.BuildRtcToken(AppId, AppCert, "29451765", 42, AgoraTokenBuilder.RtcRole.Publisher, 600, issued, salt: 1);

        Assert.StartsWith("007", token);
        var parsed = AgoraTokenBuilder.Inspect(token);
        Assert.Equal(AppId, parsed.AppId);
        Assert.Equal(1_111_111u, parsed.IssueTs);
        Assert.Equal(600u, parsed.Expire);
        Assert.Equal(1u, parsed.Salt);
        Assert.Equal("29451765", parsed.Channel);
        Assert.Equal("42", parsed.Uid);
        Assert.Equal(4, parsed.Privileges.Count); // join + audio + video + data
        Assert.Equal(600u, parsed.Privileges[1]);
    }

    [Fact]
    public void Subscriber_OnlyGetsJoinPrivilege_AndUidZeroIsEmpty()
    {
        var token = AgoraTokenBuilder.BuildRtcToken(AppId, AppCert, "chan", 0, AgoraTokenBuilder.RtcRole.Subscriber, 60, DateTimeOffset.UnixEpoch, salt: 7);

        var parsed = AgoraTokenBuilder.Inspect(token);
        Assert.Single(parsed.Privileges);
        Assert.Equal("", parsed.Uid);
    }

    [Fact]
    public void Build_IsDeterministicForFixedInputs_AndChangesWithCertificate()
    {
        var issued = DateTimeOffset.FromUnixTimeSeconds(1_700_000_000);
        var a = AgoraTokenBuilder.BuildRtcToken(AppId, AppCert, "chan", 1, AgoraTokenBuilder.RtcRole.Publisher, 600, issued, salt: 5);
        var b = AgoraTokenBuilder.BuildRtcToken(AppId, AppCert, "chan", 1, AgoraTokenBuilder.RtcRole.Publisher, 600, issued, salt: 5);
        var c = AgoraTokenBuilder.BuildRtcToken(AppId, "0000000000000000000000000000000f", "chan", 1, AgoraTokenBuilder.RtcRole.Publisher, 600, issued, salt: 5);

        Assert.Equal(a, b);
        Assert.NotEqual(a, c);
    }

    [Fact]
    public void Build_RejectsMissingInputs()
    {
        Assert.ThrowsAny<ArgumentException>(() => AgoraTokenBuilder.BuildRtcToken("", AppCert, "chan", 1, AgoraTokenBuilder.RtcRole.Publisher, 60));
        Assert.ThrowsAny<ArgumentException>(() => AgoraTokenBuilder.BuildRtcToken(AppId, "", "chan", 1, AgoraTokenBuilder.RtcRole.Publisher, 60));
        Assert.ThrowsAny<ArgumentException>(() => AgoraTokenBuilder.BuildRtcToken(AppId, AppCert, " ", 1, AgoraTokenBuilder.RtcRole.Publisher, 60));
    }
}
