using Mehfil.Core.Options;
using Mehfil.Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Data;

/// <summary>
/// Code First startup gate: creates the database if missing, applies pending migrations,
/// then seeds catalog data. Controlled by the "Database" options section.
/// </summary>
public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");
        var db = scope.ServiceProvider.GetRequiredService<MehfilDbContext>();

        if (options.AutoMigrate)
        {
            var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
            if (pending.Count > 0)
            {
                logger.LogInformation("Applying {Count} pending migration(s): {Migrations}", pending.Count, string.Join(", ", pending));
            }

            await db.Database.MigrateAsync(ct);
            logger.LogInformation("Database is up to date");
        }
        else
        {
            logger.LogInformation("AutoMigrate is disabled; skipping migrations");
        }

        if (options.SeedData)
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
            await seeder.SeedAsync(ct);
        }

        // Presence lives in memory: after a restart nobody is online and no seat is held.
        var seatsCleared = await db.ClubSeats.Where(s => s.UserId != null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UserId, (long?)null).SetProperty(x => x.TakenAt, (DateTimeOffset?)null).SetProperty(x => x.IsMuted, false), ct);
        var clubsReset = await db.Clubs.Where(c => c.OnlineCount != 0).ExecuteUpdateAsync(s => s.SetProperty(c => c.OnlineCount, 0), ct);
        if (seatsCleared > 0 || clubsReset > 0)
        {
            logger.LogInformation("Reset room presence: {Seats} seats released, {Clubs} clubs marked offline", seatsCleared, clubsReset);
        }
    }
}
