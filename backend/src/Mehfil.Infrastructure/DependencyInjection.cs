using Mehfil.Core.Auth;
using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Moderation;
using Mehfil.Core.Options;
using Mehfil.Core.Rooms;
using Mehfil.Core.Royalty;
using Mehfil.Core.Storage;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Auth;
using Mehfil.Infrastructure.Catalog;
using Mehfil.Infrastructure.Clubs;
using Mehfil.Infrastructure.Data;
using Mehfil.Infrastructure.Data.Seed;
using Mehfil.Infrastructure.Moderation;
using Mehfil.Infrastructure.Rooms;
using Mehfil.Infrastructure.Royalty;
using Mehfil.Infrastructure.Storage;
using Mehfil.Infrastructure.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Mehfil.Infrastructure;

public static class DependencyInjection
{
    public const string ConnectionStringName = "Default";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<DatabaseOptions>().Bind(configuration.GetSection(DatabaseOptions.SectionName));
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddOptions<GoogleAuthOptions>().Bind(configuration.GetSection(GoogleAuthOptions.SectionName));
        services.AddOptions<DevLoginOptions>().Bind(configuration.GetSection(DevLoginOptions.SectionName));
        services.AddOptions<StorageOptions>().Bind(configuration.GetSection(StorageOptions.SectionName));

        services.AddSingleton<IClock, SystemClock>();
        services.AddMemoryCache();

        var connectionString = configuration.GetConnectionString(ConnectionStringName)
            ?? throw new InvalidOperationException($"Connection string '{ConnectionStringName}' is not configured.");

        services.AddDbContext<MehfilDbContext>(options => options
            .UseSqlServer(connectionString, sql =>
            {
                sql.MigrationsAssembly(typeof(MehfilDbContext).Assembly.FullName);
                sql.EnableRetryOnFailure(maxRetryCount: 3);
                sql.CommandTimeout(30);
            }));

        services.AddScoped<DbSeeder>();

        services.AddSingleton<IAccessTokenService, JwtAccessTokenService>();
        services.AddSingleton<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IRoyaltyService, RoyaltyService>();
        services.AddScoped<IClubService, ClubService>();
        services.AddScoped<IClubMembersService, ClubMembersService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddSingleton<RoomRegistry>();
        services.AddScoped<IRoomService, RoomService>();

        return services;
    }
}
