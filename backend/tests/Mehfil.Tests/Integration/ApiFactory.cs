using Mehfil.Core.Auth;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NSubstitute;

namespace Mehfil.Tests.Integration;

/// <summary>Boots the real API (migrations + seed included) against the fixture database with Google mocked.</summary>
public sealed class ApiFactory(string connectionString) : WebApplicationFactory<Program>
{
    public const string JwtSecret = "integration-test-signing-key-0123456789abcdef";

    public IGoogleTokenValidator GoogleValidator { get; } = Substitute.For<IGoogleTokenValidator>();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Default", connectionString);
        builder.UseSetting("Jwt:Secret", JwtSecret);
        builder.UseSetting("Jwt:AccessTokenMinutes", "15");
        builder.UseSetting("DevLogin:Enabled", "true");
        builder.UseSetting("Database:AutoMigrate", "true");
        builder.UseSetting("Database:SeedData", "true");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IGoogleTokenValidator>();
            services.AddSingleton(GoogleValidator);
        });
    }
}
