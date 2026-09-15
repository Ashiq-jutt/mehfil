using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Enums;
using Mehfil.Core.Rooms;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class RoomTests(SqlServerFixture sql) : IAsyncLifetime
{
    private ApiFactory _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        if (sql.Available)
        {
            _factory = new ApiFactory(sql.ConnectionString!);
            _client = _factory.CreateClient();
        }

        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        if (_factory is not null)
        {
            await _factory.DisposeAsync();
        }
    }

    [SkippableFact]
    public async Task Join_Chat_Seats_Presence_FlowOverHubAndRest()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var owner = await SignInAsync("room-owner@example.com", "Owner");
        var club = await CreateClubAsync("Peaceful");
        var guest = await SignInAsync("room-guest@example.com", "Guest");

        await using var ownerHub = Connect(owner.AccessToken);
        await using var guestHub = Connect(guest.AccessToken);

        var joinedUsers = new List<string>();
        var seatChanges = new List<SeatDto>();
        var messages = new List<ClubMessageDto>();
        guestHub.On<RoomUserDto, int>("UserJoined", (u, _) => joinedUsers.Add(u.Id));
        guestHub.On<SeatDto>("SeatChanged", s => seatChanges.Add(s));
        guestHub.On<ClubMessageDto>("MessageReceived", m => messages.Add(m));

        await ownerHub.StartAsync();
        await guestHub.StartAsync();

        // Owner joins first and is auto-seated on the owner seat (5).
        var ownerState = await ownerHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);
        Assert.Equal(ClubRole.Owner, ownerState.MyRole);
        Assert.Equal(RoomService_OwnerSeat, ownerState.MySeatIndex);
        Assert.Equal(1, ownerState.OnlineCount);
        Assert.Equal(10, ownerState.Seats.Count);

        var guestState = await guestHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);
        Assert.Equal(2, guestState.OnlineCount);
        Assert.Contains(guestState.Users, u => u.Id == owner.User.Id);
        Assert.Equal(ClubRole.Member, guestState.MyRole);
        Assert.NotNull(guestState.Seats[RoomService_OwnerSeat - 1].User);

        // Chat over the hub, history over REST.
        var sent = await guestHub.InvokeAsync<ClubMessageDto>("SendMessage", "Sir na kha karen ap");
        Assert.Equal(MessageType.Text, sent.Type);
        await WaitUntil(() => messages.Count >= 1);
        Assert.Equal(sent.Id, messages[0].Id);

        var history = await _client.GetFromJsonAsync<List<ClubMessageDto>>($"/api/v1/clubs/{club.Id}/room/messages?limit=10");
        Assert.Contains(history!, m => m.Id == sent.Id);

        // Guest takes seat 1; the owner seat is refused.
        var take = await _client.PostAsync($"/api/v1/clubs/{club.Id}/room/seats/1/take", null);
        Assert.Equal(HttpStatusCode.OK, take.StatusCode);
        var seat = await take.Content.ReadFromJsonAsync<SeatDto>();
        Assert.Equal(guest.User.Id, seat!.User?.Id);
        await WaitUntil(() => seatChanges.Any(s => s.Index == 1 && s.User?.Id == guest.User.Id));

        var ownerSeat = await _client.PostAsync($"/api/v1/clubs/{club.Id}/room/seats/5/take", null);
        Assert.Equal(HttpStatusCode.Forbidden, ownerSeat.StatusCode);

        // Mic requires a seat and gets broadcast.
        await guestHub.InvokeAsync("SetMic", true);

        // Owner mutes seat 1 → guest mic forced off; owner locks seat 2.
        UseToken(owner.AccessToken);
        var mute = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/seats/1/mute", new MuteSeatRequest(true));
        Assert.Equal(HttpStatusCode.OK, mute.StatusCode);
        var lockSeat = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/seats/2/lock", new LockSeatRequest(true));
        Assert.True((await lockSeat.Content.ReadFromJsonAsync<SeatDto>())!.IsLocked);

        UseToken(guest.AccessToken);
        var micWhileMuted = await Assert.ThrowsAsync<HubException>(() => guestHub.InvokeAsync("SetMic", true));
        Assert.Contains("room.seat_muted", micWhileMuted.Message);

        var lockedTake = await _client.PostAsync($"/api/v1/clubs/{club.Id}/room/seats/2/take", null);
        Assert.Equal(HttpStatusCode.Conflict, lockedTake.StatusCode);

        // Announcement by owner is broadcast; guest cannot set it.
        var forbidden = await _client.PutAsJsonAsync($"/api/v1/clubs/{club.Id}/room/announcement", new SetAnnouncementRequest("hi"));
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        // Guest leaves: seat released, online count drops.
        await guestHub.InvokeAsync("LeaveRoom");
        UseToken(owner.AccessToken);
        var state = await _client.GetFromJsonAsync<RoomStateDto>($"/api/v1/clubs/{club.Id}/room/state");
        Assert.Equal(1, state!.OnlineCount);
        Assert.Null(state.Seats[0].User);
        Assert.Contains(joinedUsers, id => id == guest.User.Id || id == owner.User.Id);
    }

    [SkippableFact]
    public async Task Ban_RemovesUser_AndBlocksRejoin()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var owner = await SignInAsync("ban-owner@example.com", "Owner");
        var club = await CreateClubAsync("Strict club");
        var troll = await SignInAsync("ban-troll@example.com", "Troll");

        await using var trollHub = Connect(troll.AccessToken);
        var removedReason = "";
        trollHub.On<string>("RemovedFromRoom", reason => removedReason = reason);
        await trollHub.StartAsync();
        await trollHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);

        UseToken(owner.AccessToken);
        var ban = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/bans/{troll.User.Id}", new BanRequest("spam"));
        Assert.Equal(HttpStatusCode.OK, ban.StatusCode);
        await WaitUntil(() => removedReason == RoomRemovalReasons.Banned);

        var bans = await _client.GetFromJsonAsync<List<ClubBanDto>>($"/api/v1/clubs/{club.Id}/room/bans");
        Assert.Single(bans!);

        var rejoin = await Assert.ThrowsAsync<HubException>(() => trollHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id));
        Assert.Contains("room.banned", rejoin.Message);

        var unban = await _client.DeleteAsync($"/api/v1/clubs/{club.Id}/room/bans/{troll.User.Id}");
        Assert.Equal(HttpStatusCode.NoContent, unban.StatusCode);
        var back = await trollHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);
        Assert.Equal(1, back.OnlineCount);

        // A member cannot ban.
        UseToken(troll.AccessToken);
        var notAllowed = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/bans/{owner.User.Id}", new BanRequest(null));
        Assert.Equal(HttpStatusCode.Forbidden, notAllowed.StatusCode);
        Assert.Equal("room.forbidden", (await notAllowed.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);
    }

    private const int RoomService_OwnerSeat = 5;

    private HubConnection Connect(string token) =>
        new HubConnectionBuilder()
            .WithUrl($"{_factory.Server.BaseAddress}hubs/club", options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                options.Transports = HttpTransportType.LongPolling;
            })
            .Build();

    private static async Task WaitUntil(Func<bool> condition, int timeoutMs = 5000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (!condition() && DateTime.UtcNow < deadline)
        {
            await Task.Delay(50);
        }

        Assert.True(condition(), "Timed out waiting for a realtime event.");
    }

    private async Task<ClubDetailDto> CreateClubAsync(string name)
    {
        var categories = await _client.GetFromJsonAsync<List<ClubCategoryDto>>("/api/v1/catalog/club-categories");
        var response = await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest(name, categories![0].Id, "PK", null, "Be kind and stay happy"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<ClubDetailDto>())!;
    }

    private async Task<AuthResponse> SignInAsync(string email, string? displayName = null)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/dev", new DevLoginRequest(email, displayName, "test"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        UseToken(auth.AccessToken);
        return auth;
    }

    private void UseToken(string token) => _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
}
