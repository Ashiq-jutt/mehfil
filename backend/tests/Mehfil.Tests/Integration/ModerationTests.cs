using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Moderation;
using Mehfil.Core.Notifications;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class ModerationTests(SqlServerFixture sql) : IAsyncLifetime
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
    public async Task Follow_NotifiesOwner_AndNotificationsCanBeRead()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var owner = await SignInAsync("notif-owner@example.com", "Owner");
        var club = await CreateClubAsync("Notify club");

        await SignInAsync("notif-fan@example.com", "Fan");
        await _client.PutAsJsonAsync("/api/v1/users/me/device-token", new RegisterDeviceRequest(DevicePlatform.Android, "fcm-token-fan"));
        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsync($"/api/v1/clubs/{club.Id}/follow", null)).StatusCode);

        UseToken(owner.AccessToken);
        var list = await _client.GetFromJsonAsync<NotificationListDto>("/api/v1/notifications");
        Assert.Equal(1, list!.UnreadCount);
        var n = Assert.Single(list.Notifications.Items);
        Assert.Equal(NotificationType.ClubFollowed, n.Type);
        Assert.Contains("Fan", n.Title);
        Assert.Contains(club.Id, n.DataJson!);

        var remaining = await (await _client.PostAsync($"/api/v1/notifications/{n.Id}/read", null)).Content.ReadFromJsonAsync<int>();
        Assert.Equal(0, remaining);

        var settings = await _client.GetFromJsonAsync<NotificationSettingsDto>("/api/v1/notifications/settings");
        Assert.True(settings!.PushFollows);
        var updated = await (await _client.PutAsJsonAsync("/api/v1/notifications/settings", new UpdateNotificationSettingsRequest(true, false, true, true)))
            .Content.ReadFromJsonAsync<NotificationSettingsDto>();
        Assert.False(updated!.PushFollows);
    }

    [SkippableFact]
    public async Task Blocks_ListAndUnblock_AndAdminQueueIsRoleGated()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var target = await SignInAsync("block-target@example.com", "Target");
        var me = await SignInAsync("block-me@example.com", "Me");

        var self = await _client.PutAsync($"/api/v1/blocks/{me.User.Id}", null);
        Assert.Equal(HttpStatusCode.BadRequest, self.StatusCode);

        var blocked = await (await _client.PutAsync($"/api/v1/blocks/{target.User.Id}", null)).Content.ReadFromJsonAsync<List<BlockedUserDto>>();
        Assert.Single(blocked!, b => b.Id == target.User.Id);
        var listed = await _client.GetFromJsonAsync<List<BlockedUserDto>>("/api/v1/blocks");
        Assert.Single(listed!);
        var unblocked = await (await _client.DeleteAsync($"/api/v1/blocks/{target.User.Id}")).Content.ReadFromJsonAsync<List<BlockedUserDto>>();
        Assert.Empty(unblocked!);

        // Ordinary users cannot see the moderation queue.
        var forbidden = await _client.GetAsync("/api/v1/admin/reports");
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        // Promote "me" to moderator directly in the database, sign in again for a token carrying the role.
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MehfilDbContext>();
            await db.Users.Where(u => u.PublicId == me.User.Id).ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, UserRole.Moderator));
        }

        await SignInAsync("block-me@example.com", "Me");
        var report = await (await _client.PostAsJsonAsync("/api/v1/reports", new CreateReportRequest(ReportTargetType.User, target.User.Id, "spam", "Sends links"))).Content.ReadFromJsonAsync<ReportDto>();
        var queue = await _client.GetFromJsonAsync<PagedResult<AdminReportDto>>("/api/v1/admin/reports?status=Open");
        var row = Assert.Single(queue!.Items, r => r.Id == report!.Id);
        Assert.Equal("Target", row.TargetName);

        var resolved = await (await _client.PutAsJsonAsync($"/api/v1/admin/reports/{report!.Id}", new ResolveReportRequest(ReportStatus.Reviewed, ReportActions.SuspendUser)))
            .Content.ReadFromJsonAsync<AdminReportDto>();
        Assert.Equal(ReportStatus.ActionTaken, resolved!.Status);

        // The suspended user can no longer refresh their session.
        var refresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshRequest(target.RefreshToken));
        Assert.NotEqual(HttpStatusCode.OK, refresh.StatusCode);
    }

    [SkippableFact]
    public async Task DeleteAccount_AnonymisesAndRevokes()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var user = await SignInAsync("delete-me@example.com", "Gone Soon");
        await CreateClubAsync("Soon inactive");

        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync("/api/v1/users/me")).StatusCode);

        var refresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshRequest(user.RefreshToken));
        Assert.NotEqual(HttpStatusCode.OK, refresh.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MehfilDbContext>();
        var row = await db.Users.AsNoTracking().SingleAsync(u => u.PublicId == user.User.Id);
        Assert.Equal(UserStatus.Deleted, row.Status);
        Assert.Equal("Deleted user", row.DisplayName);
        Assert.DoesNotContain("delete-me", row.Email);
        Assert.False(await db.Clubs.AnyAsync(c => c.OwnerId == row.Id && c.IsActive));
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
        UseToken(auth.AccessToken);
        return auth;
    }

    private void UseToken(string token) => _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
}
