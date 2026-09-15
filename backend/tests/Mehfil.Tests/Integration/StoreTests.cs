using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Enums;
using Mehfil.Core.Rooms;
using Mehfil.Core.Store;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR.Client;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class StoreTests(SqlServerFixture sql) : IAsyncLifetime
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
    public async Task Store_ListsKinds_LocksByRule_AndEquipsOwnedItems()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var me = await SignInAsync("store-owner@example.com", "Owner");

        var store = await _client.GetFromJsonAsync<StoreDto>("/api/v1/store");
        Assert.Equal(6, store!.Kinds.Count);
        Assert.Null(store.ClubId);
        var defaultFrame = store.Items.Single(i => i.Code == "frame_default");
        Assert.True(defaultFrame.IsOwned);
        Assert.True(defaultFrame.IsEquipped);
        var royalFrame = store.Items.Single(i => i.Code == "frame_royal_6");
        Assert.True(royalFrame.IsLocked);
        Assert.Equal("Royal 6", royalFrame.LockReason);
        Assert.All(store.Items.Where(i => i.Kind == StoreItemKind.ClubDp), i => Assert.True(i.IsOwned && !i.IsEquipped));

        // Locked items cannot be equipped.
        var locked = await _client.PostAsync("/api/v1/store/items/frame_royal_6/equip", null);
        Assert.Equal(HttpStatusCode.Conflict, locked.StatusCode);
        Assert.Equal("store.locked", (await locked.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);

        // Club kinds need a club.
        var noClub = await _client.PostAsync("/api/v1/store/items/clubdp_lantern/equip", null);
        Assert.Equal(HttpStatusCode.BadRequest, noClub.StatusCode);
        Assert.Equal("store.no_club", (await noClub.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);

        var club = await CreateClubAsync("Store club");
        var equipped = await (await _client.PostAsync("/api/v1/store/items/clubdp_lantern/equip", null)).Content.ReadFromJsonAsync<EquipResultDto>();
        Assert.Equal(StoreItemKind.ClubDp, equipped!.Kind);
        Assert.Equal("clubdp_lantern", equipped.EquippedCode);

        // Backgrounds unlocked by club level: level 1 club cannot use "Level 4 Scene" but can use the default.
        var tooLow = await _client.PostAsync("/api/v1/store/items/background_club_4/equip", null);
        Assert.Equal(HttpStatusCode.Conflict, tooLow.StatusCode);
        var background = await (await _client.PostAsync("/api/v1/store/items/background_default/equip", null)).Content.ReadFromJsonAsync<EquipResultDto>();
        Assert.Null(background!.EquippedCode);

        store = await _client.GetFromJsonAsync<StoreDto>("/api/v1/store");
        Assert.Equal(club.Id, store!.ClubId);
        Assert.True(store.Items.Single(i => i.Code == "clubdp_lantern").IsEquipped);
        Assert.True(store.Items.Single(i => i.Code == "background_default").IsEquipped);
        Assert.Equal(store.Items.Count(i => i.Kind == StoreItemKind.ClubDp), store.Kinds.Single(k => k.Kind == StoreItemKind.ClubDp).Count);

        // The room state carries the equipped background (default = null) and the user's frame (default = null).
        await using var hub = new HubConnectionBuilder()
            .WithUrl($"{_factory.Server.BaseAddress}hubs/club", options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult<string?>(me.AccessToken);
                options.Transports = HttpTransportType.LongPolling;
            })
            .Build();
        await hub.StartAsync();
        var state = await hub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);
        Assert.Null(state.Club.BackgroundCode);
        Assert.Null(state.Users.Single(u => u.Id == me.User.Id).FrameCode);
    }

    private async Task<ClubDetailDto> CreateClubAsync(string name)
    {
        var categories = await _client.GetFromJsonAsync<List<ClubCategoryDto>>("/api/v1/catalog/club-categories");
        var response = await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest(name, categories![0].Id, "PK", null, null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<ClubDetailDto>())!;
    }

    private async Task<AuthResponse> SignInAsync(string email, string? displayName = null)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/dev", new DevLoginRequest(email, displayName, "test"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return auth;
    }
}
