using Mehfil.Infrastructure.Rooms;

namespace Mehfil.Tests.Unit;

public sealed class RoomRegistryTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 15, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void FirstConnection_MarksUserOnline_SecondDoesNot()
    {
        var registry = new RoomRegistry();

        var first = registry.AddConnection(clubId: 1, userId: 10, "c1", Now);
        var second = registry.AddConnection(1, 10, "c2", Now);

        Assert.True(first.IsFirstConnection);
        Assert.False(second.IsFirstConnection);
        Assert.Equal(1, registry.Count(1));
        Assert.Equal(1L, registry.GetUserRoom(10));
    }

    [Fact]
    public void RemovingLastConnection_MarksUserLeft()
    {
        var registry = new RoomRegistry();
        registry.AddConnection(1, 10, "c1", Now);
        registry.AddConnection(1, 10, "c2", Now);

        var partial = registry.RemoveConnection("c1");
        var final = registry.RemoveConnection("c2");
        var unknown = registry.RemoveConnection("nope");

        Assert.False(partial!.UserLeft);
        Assert.True(final!.UserLeft);
        Assert.Equal(Now, final.JoinedAt);
        Assert.Null(unknown);
        Assert.Equal(0, registry.Count(1));
        Assert.Null(registry.GetUserRoom(10));
    }

    [Fact]
    public void JoiningAnotherRoom_ReportsPreviousRoom_AndMovesUser()
    {
        var registry = new RoomRegistry();
        registry.AddConnection(1, 10, "c1", Now);

        var moved = registry.AddConnection(2, 10, "c2", Now.AddMinutes(1));

        Assert.Equal(1L, moved.PreviousClubId);
        Assert.True(moved.IsFirstConnection);
        Assert.Equal(0, registry.Count(1));
        Assert.Equal(1, registry.Count(2));
        Assert.Null(registry.RemoveConnection("c1")); // old connection was dropped with the move
    }

    [Fact]
    public void RemoveUser_ReturnsConnections_AndClearsRoom()
    {
        var registry = new RoomRegistry();
        registry.AddConnection(1, 10, "c1", Now);
        registry.AddConnection(1, 10, "c2", Now);
        registry.AddConnection(1, 11, "c3", Now);

        var removed = registry.RemoveUser(10);

        Assert.NotNull(removed);
        Assert.Equal(2, removed.Value.Connections.Count);
        Assert.Equal([11L], registry.GetUsers(1));
        Assert.Null(registry.RemoveUser(99));
    }

    [Fact]
    public void MicAndSpeaking_FollowRules()
    {
        var registry = new RoomRegistry();
        registry.AddConnection(1, 10, "c1", Now);

        Assert.Equal((1L, false, false), registry.SetSpeaking(10, true)); // cannot speak with mic off
        Assert.Equal((1L, true, false), registry.SetMic(10, true));
        Assert.Equal((1L, true, true), registry.SetSpeaking(10, true));
        Assert.Equal((1L, false, false), registry.SetMic(10, false)); // muting stops speaking
        Assert.Null(registry.SetMic(99, true));
    }

    [Fact]
    public void MessageRateLimit_AllowsAfterInterval()
    {
        var registry = new RoomRegistry();
        registry.AddConnection(1, 10, "c1", Now);
        var interval = TimeSpan.FromMilliseconds(700);

        Assert.True(registry.TryMarkMessage(10, Now, interval));
        Assert.False(registry.TryMarkMessage(10, Now.AddMilliseconds(200), interval));
        Assert.True(registry.TryMarkMessage(10, Now.AddMilliseconds(800), interval));
        Assert.False(registry.TryMarkMessage(99, Now, interval)); // not in a room
    }
}
