using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Enums;
using Mehfil.Core.Royalty;
using Mehfil.Core.Users;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Tests.Integration;

[Collection(nameof(SqlServerCollection))]
public sealed class ProfileTests(SqlServerFixture sql) : IAsyncLifetime
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
    public async Task Profile_UpdateNameSignatureCountry_Persists()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("profile-1@example.com");

        var response = await _client.PatchAsJsonAsync("/api/v1/users/me", new UpdateProfileRequest("Mobile Dev", "Hello there", "pk"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var profile = await response.Content.ReadFromJsonAsync<ProfileDto>();
        Assert.NotNull(profile);
        Assert.Equal("Mobile Dev", profile.User.DisplayName);
        Assert.Equal("Hello there", profile.User.Signature);
        Assert.Equal("PK", profile.User.CountryCode);
        Assert.Equal("Pakistan", profile.CountryName);
        Assert.Equal("🇵🇰", profile.FlagEmoji);
    }

    [SkippableFact]
    public async Task Profile_UnknownCountry_Returns400()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("profile-2@example.com");

        var response = await _client.PatchAsJsonAsync("/api/v1/users/me", new UpdateProfileRequest(null, null, "ZZ"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("profile.invalid_country", problem?.Title);
    }

    [SkippableFact]
    public async Task Gender_CanBeSetOnce_ThenLocked()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("profile-3@example.com");

        var first = await _client.PutAsJsonAsync("/api/v1/users/me/gender", new SetGenderRequest(Gender.Female));
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var profile = await first.Content.ReadFromJsonAsync<ProfileDto>();
        Assert.Equal(Gender.Female, profile!.User.Gender);
        Assert.True(profile.User.GenderLocked);

        var second = await _client.PutAsJsonAsync("/api/v1/users/me/gender", new SetGenderRequest(Gender.Male));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        var problem = await second.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("profile.gender_locked", problem?.Title);
    }

    [SkippableFact]
    public async Task Birthday_ValidatesDayAgainstMonth()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("profile-4@example.com");

        var bad = await _client.PutAsJsonAsync("/api/v1/users/me/birthday", new SetBirthdayRequest(31, 2));
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);

        var ok = await _client.PutAsJsonAsync("/api/v1/users/me/birthday", new SetBirthdayRequest(20, 12));
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var profile = await ok.Content.ReadFromJsonAsync<ProfileDto>();
        Assert.Equal((byte)20, profile!.User.BirthDay);
        Assert.Equal((byte)12, profile.User.BirthMonth);
    }

    [SkippableFact]
    public async Task Avatar_UploadStoresFile_AndRejectsNonImages()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("profile-5@example.com");

        using var png = new MultipartFormDataContent();
        var pngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 0x49, 0x48, 0x44, 0x52 };
        var pngContent = new ByteArrayContent(pngBytes);
        pngContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        png.Add(pngContent, "file", "avatar.png");

        var upload = await _client.PostAsync("/api/v1/users/me/avatar", png);
        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
        var profile = await upload.Content.ReadFromJsonAsync<ProfileDto>();
        Assert.StartsWith("/uploads/avatars/", profile!.User.AvatarUrl);
        Assert.EndsWith(".png", profile.User.AvatarUrl);

        var served = await _client.GetAsync(profile.User.AvatarUrl);
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);

        using var text = new MultipartFormDataContent();
        var textContent = new ByteArrayContent("<svg/>"u8.ToArray());
        textContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        text.Add(textContent, "file", "fake.png");

        var rejected = await _client.PostAsync("/api/v1/users/me/avatar", text);
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        var problem = await rejected.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("profile.avatar_unsupported", problem?.Title);
    }

    [SkippableFact]
    public async Task PublicProfile_ByPublicId_CountsViewsAndHidesEmail()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        var subject = await SignInAsync("profile-6@example.com");
        await SignInAsync("profile-7@example.com"); // viewer

        var response = await _client.GetAsync($"/api/v1/users/{subject.User.Id.ToLowerInvariant()}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var card = await response.Content.ReadFromJsonAsync<PublicProfileDto>();
        Assert.Equal(subject.User.Id, card!.Id);
        Assert.Equal(1, card.Stats.ProfileViews);

        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("profile-6@example.com", body);

        var missing = await _client.GetAsync("/api/v1/users/NOPE0000");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [SkippableFact]
    public async Task Catalog_AndRoyalty_Endpoints_Work()
    {
        Skip.IfNot(sql.Available, sql.UnavailableReason);
        await SignInAsync("profile-8@example.com");

        var countries = await _client.GetFromJsonAsync<List<CountryDto>>("/api/v1/catalog/countries");
        Assert.NotNull(countries);
        Assert.True(countries.Count >= 30);
        Assert.Equal("PK", countries[0].Code); // featured first, in seed order

        var royalty = await _client.GetFromJsonAsync<RoyaltyDto>("/api/v1/royalty");
        Assert.NotNull(royalty);
        Assert.Equal(6, royalty.RoyalLevels.Count);
        Assert.Equal("R6", royalty.RoyalLevels[0].Code);
        Assert.Equal("R1", royalty.NextLevelCode);
        Assert.Equal(1_000, royalty.PointsToNextLevel);
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
