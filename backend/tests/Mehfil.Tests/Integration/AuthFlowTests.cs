using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Common;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class AuthFlowTests(SqlServerFixture sql) : IAsyncLifetime
{
    private const string GoodToken = "good-google-token";
    private const string BadToken = "bad-google-token";

    private ApiFactory _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        if (!sql.Available)
        {
            return Task.CompletedTask;
        }

        _factory = new ApiFactory(sql.ConnectionString!);
        _factory.GoogleValidator
            .ValidateAsync(GoodToken, Arg.Any<CancellationToken>())
            .Returns(new GoogleUserInfo("google-sub-1", "Alice@Example.com", true, "Alice Example", "https://img/alice.png"));
        _factory.GoogleValidator
            .ValidateAsync(BadToken, Arg.Any<CancellationToken>())
            .ThrowsAsync(new UnauthorizedException("auth.invalid_google_token", "bad"));
        _client = _factory.CreateClient();
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
    public async Task Startup_MigratesDatabase_AndSeedsCatalogs()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MehfilDbContext>();

        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        Assert.True(await db.Countries.AnyAsync(c => c.Code == "PK" && c.IsFeatured));
        Assert.Equal(4, await db.ClubCategories.CountAsync());
        Assert.True(await db.Gifts.AnyAsync(g => g.Code == "rose"));
        Assert.True(await db.HeartsPackages.AnyAsync(p => p.IsWelcomeOffer));
        Assert.True(await db.StoreItems.AnyAsync(s => s.Code == "frame_default"));

        var health = await _client.GetAsync("/healthz");
        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
    }

    [SkippableFact]
    public async Task GoogleLogin_NewUser_CreatesProfile_AndAccessTokenWorks()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleLoginRequest(GoodToken, "Pixel 8"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        Assert.True(auth.IsNewUser);
        Assert.Equal("alice@example.com", auth.User.Email);
        Assert.Equal("Alice Example", auth.User.DisplayName);
        Assert.StartsWith("ALIC", auth.User.Id);
        Assert.Equal(0, auth.User.HeartsBalance);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        var me = await _client.GetFromJsonAsync<UserDto>("/api/v1/users/me");
        Assert.NotNull(me);
        Assert.Equal(auth.User.Id, me.Id);

        // Second login with the same Google subject reuses the account.
        var again = await (await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleLoginRequest(GoodToken, null)))
            .Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(again);
        Assert.False(again.IsNewUser);
        Assert.Equal(auth.User.Id, again.User.Id);
    }

    [SkippableFact]
    public async Task Refresh_RotatesToken_AndReuseOfOldTokenRevokesAllSessions()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var first = await LoginDevAsync("bob@example.com");

        var rotated = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshRequest(first.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, rotated.StatusCode);
        var second = await rotated.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(second);
        Assert.NotEqual(first.RefreshToken, second.RefreshToken);

        // Presenting the already-rotated token is treated as theft…
        var reuse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshRequest(first.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
        var problem = await reuse.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("auth.invalid_refresh_token", problem?.Title);

        // …so the newest token is revoked as well.
        var afterReuse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshRequest(second.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, afterReuse.StatusCode);
    }

    [SkippableFact]
    public async Task Logout_RevokesRefreshToken()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var auth = await LoginDevAsync("carol@example.com");

        var logout = await _client.PostAsJsonAsync("/api/v1/auth/logout", new LogoutRequest(auth.RefreshToken));
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        var refresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshRequest(auth.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
    }

    [SkippableFact]
    public async Task GoogleLogin_InvalidToken_Returns401ProblemDetails()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleLoginRequest(BadToken, null));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("auth.invalid_google_token", problem?.Title);
    }

    [SkippableFact]
    public async Task MissingFields_Return400ValidationProblem()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new { idToken = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("IdToken", problem.Errors.Keys);
    }

    [SkippableFact]
    public async Task ProtectedEndpoint_WithoutToken_Returns401()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);

        var response = await _client.GetAsync("/api/v1/users/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<AuthResponse> LoginDevAsync(string email)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/dev", new DevLoginRequest(email, null, "test"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        return auth;
    }
}

[CollectionDefinition(nameof(SqlServerCollection))]
public sealed class SqlServerCollection : ICollectionFixture<SqlServerFixture>;
