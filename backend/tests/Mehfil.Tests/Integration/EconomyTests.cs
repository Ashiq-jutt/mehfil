using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Economy;
using Mehfil.Core.Enums;
using Mehfil.Core.Rooms;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR.Client;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class EconomyTests(SqlServerFixture sql) : IAsyncLifetime
{
    private ApiFactory _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        if (sql.Available)
        {
            _factory = new ApiFactory(sql.ConnectionString!, new Dictionary<string, string?> { ["Purchases:SandboxMode"] = "true" });
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
    public async Task SandboxPurchase_CreditsHeartsAndRoyalty_Idempotently()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("buyer@example.com");

        var shop = await _client.GetFromJsonAsync<ShopDto>("/api/v1/wallet/shop");
        Assert.True(shop!.SandboxMode);
        var welcome = shop.Packages.Single(p => p.IsWelcomeOffer);
        Assert.True(welcome.IsAvailable);
        Assert.NotEmpty(welcome.BonusGifts);

        var first = await _client.PostAsJsonAsync("/api/v1/wallet/purchases/verify", new VerifyPurchaseRequest(DevicePlatform.Android, welcome.Code, "txn-1", null));
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var result = await first.Content.ReadFromJsonAsync<PurchaseResultDto>();
        Assert.Equal(PurchaseStatus.Verified, result!.Status);
        Assert.Equal(welcome.Hearts, result.HeartsGranted);
        Assert.True(result.Balance > welcome.Hearts); // bonus gifts credited on top
        Assert.Equal(welcome.RoyaltyPoints, result.RoyaltyPoints);
        Assert.False(result.AlreadyProcessed);

        var replay = await (await _client.PostAsJsonAsync("/api/v1/wallet/purchases/verify", new VerifyPurchaseRequest(DevicePlatform.Android, welcome.Code, "txn-1", null)))
            .Content.ReadFromJsonAsync<PurchaseResultDto>();
        Assert.True(replay!.AlreadyProcessed);
        Assert.Equal(result.Balance, replay.Balance);

        var again = await _client.PostAsJsonAsync("/api/v1/wallet/purchases/verify", new VerifyPurchaseRequest(DevicePlatform.Android, welcome.Code, "txn-2", null));
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("purchases.welcome_used", (await again.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);

        var wallet = await _client.GetFromJsonAsync<WalletDto>("/api/v1/wallet");
        Assert.Equal(result.Balance, wallet!.Balance);
        Assert.Equal(2, wallet.Ledger.TotalCount); // purchase + bonus
    }

    [SkippableFact]
    public async Task SendGift_DebitsSender_FillsJar_AndBroadcasts()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var owner = await SignInAsync("gift-owner@example.com", "Owner");
        var club = await CreateClubAsync("Gift club");
        var fan = await SignInAsync("gift-fan@example.com", "Fan");
        await _client.PostAsJsonAsync("/api/v1/wallet/dev-grant", new DevGrantRequest(1000));

        await using var fanHub = Connect(fan.AccessToken);
        await using var ownerHub = Connect(owner.AccessToken);
        GiftEventDto? received = null;
        ownerHub.On<GiftEventDto>("GiftReceived", e => received = e);
        await fanHub.StartAsync();
        await ownerHub.StartAsync();
        await ownerHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);
        await fanHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);

        var gifts = await _client.GetFromJsonAsync<List<GiftDto>>("/api/v1/gifts");
        var rose = gifts!.Single(g => g.Code == "rose");

        var send = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/gifts", new SendGiftRequest("rose", 10, owner.User.Id));
        Assert.Equal(HttpStatusCode.OK, send.StatusCode);
        var result = await send.Content.ReadFromJsonAsync<SendGiftResultDto>();
        Assert.Equal(1000 - rose.HeartsPrice * 10, result!.Balance);
        Assert.Equal(rose.HeartsPrice * 10, result.Event.ClubLevel.JarHearts);
        Assert.Equal(owner.User.Id, result.Event.Receiver?.Id);

        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (received is null && DateTime.UtcNow < deadline)
        {
            await Task.Delay(50);
        }

        Assert.NotNull(received);
        Assert.Equal(result.Event.TransactionId, received.TransactionId);

        var tooMuch = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/gifts", new SendGiftRequest("castle", 1, null));
        Assert.Equal(HttpStatusCode.Conflict, tooMuch.StatusCode);
        Assert.Equal("gifts.insufficient_hearts", (await tooMuch.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);

        var level = await _client.GetFromJsonAsync<ClubLevelDto>($"/api/v1/clubs/{club.Id}/room/level");
        Assert.Equal(rose.HeartsPrice * 10, level!.TotalHearts);

        var history = await _client.GetFromJsonAsync<List<ClubMessageDto>>($"/api/v1/clubs/{club.Id}/room/messages");
        Assert.Contains(history!, m => m.Type == MessageType.Gift);

        UseToken(owner.AccessToken);
        var ownerWallet = await _client.GetFromJsonAsync<WalletDto>("/api/v1/wallet");
        Assert.Equal(rose.HeartsPrice * 10, ownerWallet!.HeartsReceived);
    }

    private HubConnection Connect(string token) =>
        new HubConnectionBuilder()
            .WithUrl($"{_factory.Server.BaseAddress}hubs/club", options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult<string?>(token);
                options.Transports = HttpTransportType.LongPolling;
            })
            .Build();

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
        UseToken(auth.AccessToken);
        return auth;
    }

    private void UseToken(string token) => _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
}
