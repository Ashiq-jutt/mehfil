using Mehfil.Api.Extensions;
using Mehfil.Core.Common;
using Mehfil.Core.Rooms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Mehfil.Api.Hubs;

/// <summary>Server → client messages. Names are the events the app subscribes to.</summary>
public interface IClubClient
{
    Task UserJoined(RoomUserDto user, int onlineCount);
    Task UserLeft(string userId, int onlineCount);
    Task SeatChanged(SeatDto seat);
    Task MessageReceived(ClubMessageDto message);
    Task MessageDeleted(long messageId);
    Task AnnouncementChanged(string? text);
    Task UserStateChanged(string userId, bool micEnabled, bool isSpeaking);
    Task RemovedFromRoom(string reason);
    Task GiftReceived(Mehfil.Core.Economy.GiftEventDto gift);
}

/// <summary>Realtime endpoint at /hubs/club. Authenticated with the same JWT (access_token query string).</summary>
[Authorize]
public sealed class ClubHub(IRoomService rooms, ILogger<ClubHub> logger) : Hub<IClubClient>
{
    public static string GroupName(long clubId) => $"club:{clubId}";

    public Task<RoomStateDto> JoinRoom(string clubId) =>
        Guard(() => rooms.JoinAsync(clubId, Context.User!.GetUserId(), Context.ConnectionId, Context.ConnectionAborted));

    public Task LeaveRoom() => Guard(() => rooms.LeaveConnectionAsync(Context.ConnectionId, Context.ConnectionAborted));

    public Task<ClubMessageDto> SendMessage(string text) =>
        Guard(() => rooms.SendMessageAsync(Context.User!.GetUserId(), text, Context.ConnectionAborted));

    public Task SetMic(bool enabled) => Guard(() => rooms.SetMicAsync(Context.User!.GetUserId(), enabled, Context.ConnectionAborted));

    public Task SetSpeaking(bool speaking) => Guard(() => rooms.SetSpeakingAsync(Context.User!.GetUserId(), speaking, Context.ConnectionAborted));

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            await rooms.LeaveConnectionAsync(Context.ConnectionId, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean up connection {ConnectionId}", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Expected failures reach the client as HubException("code: message"); anything else is logged as 500.
    private static async Task<T> Guard<T>(Func<Task<T>> action)
    {
        try
        {
            return await action();
        }
        catch (AppException ex)
        {
            throw new HubException($"{ex.Code}: {ex.Message}");
        }
    }

    private static async Task Guard(Func<Task> action)
    {
        try
        {
            await action();
        }
        catch (AppException ex)
        {
            throw new HubException($"{ex.Code}: {ex.Message}");
        }
    }
}
