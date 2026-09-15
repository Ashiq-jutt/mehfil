using Mehfil.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mehfil.Infrastructure.Data.Configurations;

public sealed class GiftTransactionConfiguration : IEntityTypeConfiguration<GiftTransaction>
{
    public void Configure(EntityTypeBuilder<GiftTransaction> b)
    {
        b.ToTable("GiftTransactions");
        b.HasKey(x => x.Id);

        // Leaderboard aggregations by period.
        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => new { x.ClubId, x.CreatedAt });
        b.HasIndex(x => new { x.SenderId, x.CreatedAt });
        b.HasIndex(x => new { x.ReceiverId, x.CreatedAt });

        b.HasOne(x => x.Club).WithMany().HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Sender).WithMany().HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Receiver).WithMany().HasForeignKey(x => x.ReceiverId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Gift).WithMany().HasForeignKey(x => x.GiftId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class PurchaseConfiguration : IEntityTypeConfiguration<Purchase>
{
    public void Configure(EntityTypeBuilder<Purchase> b)
    {
        b.ToTable("Purchases");
        b.HasKey(x => x.Id);
        b.Property(x => x.StoreTransactionId).HasMaxLength(256).IsRequired();
        b.HasIndex(x => new { x.Platform, x.StoreTransactionId }).IsUnique();
        b.HasIndex(x => new { x.UserId, x.CreatedAt });

        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Package).WithMany().HasForeignKey(x => x.PackageId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class WalletLedgerConfiguration : IEntityTypeConfiguration<WalletLedger>
{
    public void Configure(EntityTypeBuilder<WalletLedger> b)
    {
        b.ToTable("WalletLedger");
        b.HasKey(x => x.Id);
        b.Property(x => x.Note).HasMaxLength(256);
        b.HasIndex(x => new { x.UserId, x.Id }).IsDescending(false, true);

        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class UserItemConfiguration : IEntityTypeConfiguration<UserItem>
{
    public void Configure(EntityTypeBuilder<UserItem> b)
    {
        b.ToTable("UserItems");
        b.HasKey(x => new { x.UserId, x.ItemId });

        b.HasOne(x => x.User).WithMany(u => u.Items).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class LeaderboardSnapshotConfiguration : IEntityTypeConfiguration<LeaderboardSnapshot>
{
    public void Configure(EntityTypeBuilder<LeaderboardSnapshot> b)
    {
        b.ToTable("LeaderboardSnapshots");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.Board, x.Period, x.PeriodStart, x.Rank }).IsUnique();
        b.HasIndex(x => new { x.SubjectId, x.Board });

        b.HasOne(x => x.RewardItem).WithMany().HasForeignKey(x => x.RewardItemId).OnDelete(DeleteBehavior.Restrict);
    }
}
