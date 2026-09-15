using Mehfil.Core.Rooms;
using Microsoft.AspNetCore.SignalR;

namespace Mehfil.Api.Hubs;

/// <summary>IRoomNotifier over SignalR groups (one group per club).</summary>
public sealed class SignalRRoomNotifier(IHubContext<ClubHub, IClubClient> hub) : IRoomNotifier
{
    public Task AddToRoomAsync(long clubId, string connectionId) => hub.Groups.AddToGroupAsync(connectionId, ClubHub.GroupName(clubId));

    public Task RemoveFromRoomAsync(long clubId, string connectionId) => hub.Groups.RemoveFromGroupAsync(connectionId, ClubHub.GroupName(clubId));

    public Task UserJoinedAsync(long clubId, RoomUserDto user, int onlineCount) => Group(clubId).UserJoined(user, onlineCount);

    public Task UserLeftAsync(long clubId, string userPublicId, int onlineCount) => Group(clubId).UserLeft(userPublicId, onlineCount);

    public Task SeatChangedAsync(long clubId, SeatDto seat) => Group(clubId).SeatChanged(seat);

    public Task MessageReceivedAsync(long clubId, ClubMessageDto message) => Group(clubId).MessageReceived(message);

    public Task MessageDeletedAsync(long clubId, long messageId) => Group(clubId).MessageDeleted(messageId);

    public Task AnnouncementChangedAsync(long clubId, string? text) => Group(clubId).AnnouncementChanged(text);

    public Task UserStateChangedAsync(long clubId, string userPublicId, bool micEnabled, bool isSpeaking) =>
        Group(clubId).UserStateChanged(userPublicId, micEnabled, isSpeaking);

    public async Task RemovedFromRoomAsync(long clubId, IReadOnlyCollection<string> connectionIds, string reason)
    {
        if (connectionIds.Count == 0)
        {
            return;
        }

        await hub.Clients.Clients(connectionIds).RemovedFromRoom(reason);
        foreach (var connectionId in connectionIds)
        {
            await hub.Groups.RemoveFromGroupAsync(connectionId, ClubHub.GroupName(clubId));
        }
    }

    private IClubClient Group(long clubId) => hub.Clients.Group(ClubHub.GroupName(clubId));
}
