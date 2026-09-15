using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Enums;
using Mehfil.Core.Moderation;
using Mehfil.Core.Users;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class ClubAdminsAndReportsTests(SqlServerFixture sql) : IAsyncLifetime
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
    public async Task Admins_PromoteDemote_OwnerOnly_AndCapped()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var candidates = new List<AuthResponse>();
        for (var i = 0; i < 8; i++)
        {
            candidates.Add(await SignInAsync($"admin-candidate-{i}@example.com"));
        }

        var owner = await SignInAsync("admins-owner@example.com");
        var club = await CreateClubAsync("Bhatti's gang");

        var initial = await _client.GetFromJsonAsync<ClubAdminsDto>($"/api/v1/clubs/{club.Id}/admins");
        Assert.Equal(7, initial!.Max);
        Assert.Single(initial.Admins);
        Assert.Equal(ClubRole.Owner, initial.Admins[0].Role);
        Assert.Equal(owner.User.Id, initial.Admins[0].Id);

        for (var i = 0; i < 7; i++)
        {
            var promote = await _client.PutAsync($"/api/v1/clubs/{club.Id}/admins/{candidates[i].User.Id.ToLowerInvariant()}", null);
            Assert.Equal(HttpStatusCode.OK, promote.StatusCode);
        }

        var full = await _client.GetFromJsonAsync<ClubAdminsDto>($"/api/v1/clubs/{club.Id}/admins");
        Assert.Equal(8, full!.Admins.Count); // owner + 7
        Assert.Equal(7, full.Admins.Count(a => a.Role == ClubRole.Admin));

        var overCap = await _client.PutAsync($"/api/v1/clubs/{club.Id}/admins/{candidates[7].User.Id}", null);
        Assert.Equal(HttpStatusCode.Conflict, overCap.StatusCode);
        Assert.Equal("clubs.admin_limit", (await overCap.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);

        var searched = await _client.GetFromJsonAsync<ClubAdminsDto>($"/api/v1/clubs/{club.Id}/admins?search={candidates[0].User.Id}");
        Assert.Single(searched!.Admins);

        var demote = await _client.DeleteAsync($"/api/v1/clubs/{club.Id}/admins/{candidates[0].User.Id}");
        Assert.Equal(HttpStatusCode.OK, demote.StatusCode);
        var afterDemote = await demote.Content.ReadFromJsonAsync<ClubAdminsDto>();
        Assert.Equal(6, afterDemote!.Admins.Count(a => a.Role == ClubRole.Admin));

        var members = await _client.GetFromJsonAsync<Mehfil.Core.Common.PagedResult<ClubMemberDto>>($"/api/v1/clubs/{club.Id}/members?role=Member");
        Assert.Contains(members!.Items, m => m.Id == candidates[0].User.Id);

        // An admin cannot manage admins; only the owner can.
        await SignInAsExistingAsync(candidates[1]);
        var forbidden = await _client.PutAsync($"/api/v1/clubs/{club.Id}/admins/{candidates[7].User.Id}", null);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    [SkippableFact]
    public async Task UserSearch_FindsByIdAndName_ExcludingCaller()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var alice = await SignInAsync("search-alice@example.com", "Alice Wonder");
        await SignInAsync("search-bob@example.com", "Bob Builder");

        var byName = await _client.GetFromJsonAsync<List<UserSearchResultDto>>("/api/v1/users/search?q=alice");
        Assert.Contains(byName!, u => u.Id == alice.User.Id);

        var byId = await _client.GetFromJsonAsync<List<UserSearchResultDto>>($"/api/v1/users/search?q={alice.User.Id.ToLowerInvariant()}");
        Assert.Single(byId!);

        var self = await _client.GetFromJsonAsync<List<UserSearchResultDto>>("/api/v1/users/search?q=bob");
        Assert.DoesNotContain(self!, u => u.DisplayName == "Bob Builder");

        var tooShort = await _client.GetFromJsonAsync<List<UserSearchResultDto>>("/api/v1/users/search?q=a");
        Assert.Empty(tooShort!);
    }

    [SkippableFact]
    public async Task Reports_CreateOnce_ThenDuplicateConflicts_AndUnknownTarget404()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var target = await SignInAsync("report-target@example.com");
        await SignInAsync("reporter@example.com");

        var reasons = await _client.GetFromJsonAsync<List<ReportReasonDto>>("/api/v1/catalog/report-reasons");
        Assert.NotNull(reasons);
        Assert.Contains(reasons, r => r.Code == "bullying");

        var rules = await _client.GetFromJsonAsync<List<ClubRuleDto>>("/api/v1/catalog/club-rules");
        Assert.Equal(5, rules!.Count);

        var created = await _client.PostAsJsonAsync("/api/v1/reports", new CreateReportRequest(ReportTargetType.User, target.User.Id, "bullying", "Rude in chat"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var report = await created.Content.ReadFromJsonAsync<ReportDto>();
        Assert.Equal(ReportStatus.Open, report!.Status);
        Assert.Equal(target.User.Id, report.TargetId);

        var duplicate = await _client.PostAsJsonAsync("/api/v1/reports", new CreateReportRequest(ReportTargetType.User, target.User.Id, "spam", null));
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Equal("reports.duplicate", (await duplicate.Content.ReadFromJsonAsync<ProblemDetails>())?.Title);

        var missing = await _client.PostAsJsonAsync("/api/v1/reports", new CreateReportRequest(ReportTargetType.Club, "00000000", "spam", null));
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);

        var badReason = await _client.PostAsJsonAsync("/api/v1/reports", new CreateReportRequest(ReportTargetType.User, target.User.Id, "nonsense", null));
        Assert.Equal(HttpStatusCode.BadRequest, badReason.StatusCode);
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

    private Task SignInAsExistingAsync(AuthResponse auth)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return Task.CompletedTask;
    }
}
