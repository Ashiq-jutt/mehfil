using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Economy;
using Mehfil.Core.Enums;
using Mehfil.Core.Leaderboards;
using Mehfil.Core.Rooms;
using Mehfil.Core.Users;
using Mehfil.Tests.Unit;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class LeaderboardTests(SqlServerFixture sql) : IAsyncLifetime
{
    // Starts at the real time (JWT not-before checks use the system clock) and is advanced by hand later.
    private readonly FakeClock _clock = new(DateTimeOffset.UtcNow);
    private ApiFactory _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        if (sql.Available)
        {
            _factory = new ApiFactory(
                sql.ConnectionString!,
                new Dictionary<string, string?> { ["Purchases:SandboxMode"] = "true" },
                services =>
                {
                    services.RemoveAll<IClock>();
                    services.AddSingleton<IClock>(_clock);
                });
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
    public async Task Gifting_RanksLive_ThenFreezesAndRewards_WhenTheDayEnds()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var owner = await SignInAsync("lb-owner@example.com", "Owner");
        var club = await CreateClubAsync("Leaderboard club");
        var fan = await SignInAsync("lb-fan@example.com", "Fan");
        await _client.PostAsJsonAsync("/api/v1/wallet/dev-grant", new DevGrantRequest(5000));

        await using var fanHub = Connect(fan.AccessToken);
        await using var ownerHub = Connect(owner.AccessToken);
        await fanHub.StartAsync();
        await ownerHub.StartAsync();
        await ownerHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);
        await fanHub.InvokeAsync<RoomStateDto>("JoinRoom", club.Id);

        var send = await _client.PostAsJsonAsync($"/api/v1/clubs/{club.Id}/room/gifts", new SendGiftRequest("rose", 20, owner.User.Id));
        Assert.Equal(HttpStatusCode.OK, send.StatusCode);
        var hearts = (await send.Content.ReadFromJsonAsync<SendGiftResultDto>())!.Event.Hearts;

        // Live board reflects the gift immediately (cache is bumped on send).
        var gifters = await _client.GetFromJsonAsync<LeaderboardDto>("/api/v1/leaderboard/TopGifters?period=Daily");
        Assert.Equal("Today", gifters!.Current.Label);
        Assert.Equal("Yesterday", gifters.Previous.Label);
        Assert.Empty(gifters.Previous.Entries);
        var fanRow = Assert.Single(gifters.Current.Entries, e => e.Id == fan.User.Id);
        Assert.Equal(hearts, fanRow.Score);
        Assert.Equal(1, gifters.Me!.Rank);
        Assert.Equal(hearts, gifters.Me.Score);

        var receivers = await _client.GetFromJsonAsync<LeaderboardDto>("/api/v1/leaderboard/TopReceivers?period=Daily");
        Assert.Contains(receivers!.Current.Entries, e => e.Id == owner.User.Id && e.Score == hearts);

        var clubs = await _client.GetFromJsonAsync<LeaderboardDto>("/api/v1/leaderboard/TopClubs");
        Assert.Equal(LeaderboardPeriod.Weekly, clubs!.Period);
        Assert.Contains(clubs.Current.Entries, e => e.Id == club.Id && e.Score == hearts);
        Assert.Null(clubs.Me); // the fan owns no club

        var rewards = await _client.GetFromJsonAsync<LeaderboardRewardsDto>("/api/v1/leaderboard/rewards");
        Assert.Equal(3, rewards!.Boards.Count);
        var gifterRank1 = rewards.Boards.Single(b => b.Board == LeaderboardBoard.TopGifters).Ranks.Single(r => r.Rank == 1);
        Assert.NotEmpty(gifterRank1.Items);

        // Next day: yesterday freezes, the fan wins rank #1 and receives its items.
        _clock.UtcNow = _clock.UtcNow.AddDays(1);
        var frozen = await _client.GetFromJsonAsync<LeaderboardDto>("/api/v1/leaderboard/TopGifters?period=Daily");
        Assert.Empty(frozen!.Current.Entries);
        var yesterday = Assert.Single(frozen.Previous.Entries);
        Assert.Equal(1, yesterday.Rank);
        Assert.Equal(fan.User.Id, yesterday.Id);
        Assert.Equal(hearts, frozen.Previous.TotalHearts);

        // Idempotent: a second read returns the same frozen rows.
        var again = await _client.GetFromJsonAsync<LeaderboardDto>("/api/v1/leaderboard/TopGifters?period=Daily");
        Assert.Single(again!.Previous.Entries);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Mehfil.Infrastructure.Data.MehfilDbContext>();
        var fanDbId = db.Users.Single(u => u.PublicId == fan.User.Id).Id;
        var owned = db.UserItems.Where(i => i.UserId == fanDbId).Select(i => i.Item.Code).ToList();
        foreach (var item in gifterRank1.Items)
        {
            Assert.Contains(item.Code, owned);
        }

        Assert.Contains(db.Notifications, n => n.UserId == fanDbId && n.Type == NotificationType.LeaderboardReward);
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
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return auth;
    }
}
