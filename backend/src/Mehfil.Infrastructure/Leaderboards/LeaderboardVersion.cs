namespace Mehfil.Infrastructure.Leaderboards;

/// <summary>
/// Process-wide change counter for live rankings. Gifting bumps it so cached "current period" boards
/// are recomputed on the next request instead of waiting out their TTL.
/// </summary>
public sealed class LeaderboardVersion
{
    private long _value;

    public long Value => Interlocked.Read(ref _value);

    public void Bump() => Interlocked.Increment(ref _value);
}
