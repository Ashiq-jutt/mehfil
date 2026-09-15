using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class ClubsTests(SqlServerFixture sql) : IAsyncLifetime
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
    public async Task Create_ThenListedInExplore_AndOnlyOnePerOwner()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("club-owner-1@example.com");
        var category = await FirstCategoryAsync();

        var created = await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest("Gentle talk", category.Id, "PK", "Urdu", "Be kind"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var club = await created.Content.ReadFromJsonAsync<ClubDetailDto>();
        Assert.NotNull(club);
        Assert.Matches("^[1-9][0-9]{7}$", club.Id);
        Assert.Equal(ClubRole.Owner, club.MyRole);
        Assert.Equal(1, club.MemberCount);
        Assert.Equal("🇵🇰", club.FlagEmoji);
        Assert.Equal(500, club.JarTarget);

        var explore = await _client.GetFromJsonAsync<PagedResult<ClubCardDto>>("/api/v1/clubs?feed=Explore&country=PK");
        Assert.NotNull(explore);
        Assert.Contains(explore.Items, c => c.Id == club.Id && c.IsMine);

        var otherCountry = await _client.GetFromJsonAsync<PagedResult<ClubCardDto>>("/api/v1/clubs?feed=Explore&country=US");
        Assert.DoesNotContain(otherCountry!.Items, c => c.Id == club.Id);

        var second = await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest("Second club", category.Id, null, null, null));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        var problem = await second.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("clubs.already_owner", problem?.Title);
    }

    [SkippableFact]
    public async Task Follow_Unfollow_UpdatesCounts_AndMyTab()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("club-owner-2@example.com");
        var category = await FirstCategoryAsync();
        var club = await (await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest("Musafir cafe", category.Id, "PK", null, null)))
            .Content.ReadFromJsonAsync<ClubDetailDto>();

        await SignInAsync("club-fan-2@example.com");

        var follow = await _client.PostAsync($"/api/v1/clubs/{club!.Id}/follow", null);
        Assert.Equal(HttpStatusCode.OK, follow.StatusCode);
        var result = await follow.Content.ReadFromJsonAsync<FollowResultDto>();
        Assert.True(result!.IsFollowing);
        Assert.Equal(1, result.FollowerCount);

        // Following twice is idempotent.
        var again = await (await _client.PostAsync($"/api/v1/clubs/{club.Id}/follow", null)).Content.ReadFromJsonAsync<FollowResultDto>();
        Assert.Equal(1, again!.FollowerCount);

        var mine = await _client.GetFromJsonAsync<PagedResult<ClubCardDto>>("/api/v1/clubs/my?filter=Followed");
        Assert.Contains(mine!.Items, c => c.Id == club.Id && c.IsFollowing && !c.IsMine);

        var unfollow = await (await _client.DeleteAsync($"/api/v1/clubs/{club.Id}/follow")).Content.ReadFromJsonAsync<FollowResultDto>();
        Assert.False(unfollow!.IsFollowing);
        Assert.Equal(0, unfollow.FollowerCount);
    }

    [SkippableFact]
    public async Task Detail_RecordsRecentVisit_ForNonOwners()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("club-owner-3@example.com");
        var category = await FirstCategoryAsync();
        var club = await (await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest("Islamabadians", category.Id, null, null, null)))
            .Content.ReadFromJsonAsync<ClubDetailDto>();

        await SignInAsync("club-visitor-3@example.com");
        var detail = await _client.GetFromJsonAsync<ClubDetailDto>($"/api/v1/clubs/{club!.Id}");
        Assert.NotNull(detail);
        Assert.Null(detail.MyRole);
        Assert.False(detail.IsFollowing);

        var recents = await _client.GetFromJsonAsync<PagedResult<ClubCardDto>>("/api/v1/clubs/my?filter=Recents");
        Assert.Contains(recents!.Items, c => c.Id == club.Id);

        var byId = await _client.GetFromJsonAsync<ClubCardDto>($"/api/v1/clubs/by-public-id/{club.Id}");
        Assert.Equal(club.Name, byId!.Name);

        var missing = await _client.GetAsync("/api/v1/clubs/by-public-id/00000000");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [SkippableFact]
    public async Task Update_RequiresOwnerOrAdmin()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("club-owner-4@example.com");
        var category = await FirstCategoryAsync();
        var club = await (await _client.PostAsJsonAsync("/api/v1/clubs", new CreateClubRequest("Peaceful", category.Id, "TR", null, null)))
            .Content.ReadFromJsonAsync<ClubDetailDto>();

        var ok = await _client.PatchAsJsonAsync($"/api/v1/clubs/{club!.Id}", new UpdateClubRequest("Peaceful ❤️", null, null, null, "Be kind and stay happy"));
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var updated = await ok.Content.ReadFromJsonAsync<ClubDetailDto>();
        Assert.Equal("Peaceful ❤️", updated!.Name);
        Assert.Equal("Be kind and stay happy", updated.Announcement);

        await SignInAsync("club-stranger-4@example.com");
        var forbidden = await _client.PatchAsJsonAsync($"/api/v1/clubs/{club.Id}", new UpdateClubRequest("Hacked", null, null, null, null));
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
        var problem = await forbidden.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("clubs.forbidden", problem?.Title);
    }

    private async Task<ClubCategoryDto> FirstCategoryAsync()
    {
        var categories = await _client.GetFromJsonAsync<List<ClubCategoryDto>>("/api/v1/catalog/club-categories");
        Assert.NotNull(categories);
        Assert.NotEmpty(categories);
        return categories[0];
    }

    private async Task<AuthResponse> SignInAsync(string email)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/dev", new DevLoginRequest(email, null, "test"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return auth;
    }
}
