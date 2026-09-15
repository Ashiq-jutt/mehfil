using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Mehfil.Infrastructure.Data;

public class MehfilDbContext(DbContextOptions<MehfilDbContext> options, IClock clock) : DbContext(options)
{
    // Identity & devices
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();

    // Catalogs (seeded)
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<ClubCategory> ClubCategories => Set<ClubCategory>();
    public DbSet<Gift> Gifts => Set<Gift>();
    public DbSet<HeartsPackage> HeartsPackages => Set<HeartsPackage>();
    public DbSet<StoreItem> StoreItems => Set<StoreItem>();

    // Clubs
    public DbSet<Club> Clubs => Set<Club>();
    public DbSet<ClubMember> ClubMembers => Set<ClubMember>();
    public DbSet<ClubFollow> ClubFollows => Set<ClubFollow>();
    public DbSet<ClubVisit> ClubVisits => Set<ClubVisit>();
    public DbSet<ClubSeat> ClubSeats => Set<ClubSeat>();
    public DbSet<ClubBan> ClubBans => Set<ClubBan>();
    public DbSet<ClubMessage> ClubMessages => Set<ClubMessage>();
    public DbSet<ClubItem> ClubItems => Set<ClubItem>();

    // Economy
    public DbSet<GiftTransaction> GiftTransactions => Set<GiftTransaction>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<WalletLedger> WalletLedger => Set<WalletLedger>();
    public DbSet<UserItem> UserItems => Set<UserItem>();
    public DbSet<LeaderboardSnapshot> LeaderboardSnapshots => Set<LeaderboardSnapshot>();
    public DbSet<Achievement> Achievements => Set<Achievement>();

    // Moderation & notifications
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MehfilDbContext).Assembly);

        // SQL Server rejects multiple cascade paths, and we soft-delete clubs/users anyway,
        // so any FK whose delete behavior was NOT set explicitly in a configuration becomes Restrict.
        foreach (var fk in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            var explicitlyConfigured = ((IConventionForeignKey)fk).GetDeleteBehaviorConfigurationSource() == ConfigurationSource.Explicit;
            if (!explicitlyConfigured && fk.DeleteBehavior == DeleteBehavior.Cascade && !fk.IsOwnership)
            {
                fk.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = entry.Entity.CreatedAt == default ? now : entry.Entity.CreatedAt;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
