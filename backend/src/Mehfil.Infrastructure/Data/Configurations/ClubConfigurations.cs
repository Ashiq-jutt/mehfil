using Mehfil.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mehfil.Infrastructure.Data.Configurations;

public sealed class ClubConfiguration : IEntityTypeConfiguration<Club>
{
    public void Configure(EntityTypeBuilder<Club> b)
    {
        b.ToTable("Clubs");
        b.HasKey(x => x.Id);

        b.Property(x => x.PublicId).HasMaxLength(8).IsFixedLength().IsRequired();
        b.HasIndex(x => x.PublicId).IsUnique();

        b.Property(x => x.Name).HasMaxLength(48).IsRequired();
        b.Property(x => x.CoverUrl).HasMaxLength(512);
        b.Property(x => x.CountryCode).HasMaxLength(2).IsFixedLength();
        b.Property(x => x.Language).HasMaxLength(32).IsRequired();
        b.Property(x => x.Announcement).HasMaxLength(500);
        b.Property(x => x.RowVersion).IsRowVersion();

        // Explore / Hot / country filters and Top Clubs.
        b.HasIndex(x => new { x.IsActive, x.CountryCode, x.OnlineCount });
        b.HasIndex(x => new { x.IsActive, x.TotalHearts });
        b.HasIndex(x => x.OwnerId);

        b.HasOne(x => x.Country).WithMany().HasForeignKey(x => x.CountryCode).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.BackgroundItem).WithMany().HasForeignKey(x => x.BackgroundItemId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.DpItem).WithMany().HasForeignKey(x => x.DpItemId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubMemberConfiguration : IEntityTypeConfiguration<ClubMember>
{
    public void Configure(EntityTypeBuilder<ClubMember> b)
    {
        b.ToTable("ClubMembers");
        b.HasKey(x => new { x.ClubId, x.UserId });
        b.HasIndex(x => new { x.UserId, x.Role });

        b.HasOne(x => x.Club).WithMany(c => c.Members).HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany(u => u.Memberships).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubFollowConfiguration : IEntityTypeConfiguration<ClubFollow>
{
    public void Configure(EntityTypeBuilder<ClubFollow> b)
    {
        b.ToTable("ClubFollows");
        b.HasKey(x => new { x.ClubId, x.UserId });
        b.HasIndex(x => new { x.UserId, x.CreatedAt });

        b.HasOne(x => x.Club).WithMany(c => c.Followers).HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany(u => u.Follows).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubVisitConfiguration : IEntityTypeConfiguration<ClubVisit>
{
    public void Configure(EntityTypeBuilder<ClubVisit> b)
    {
        b.ToTable("ClubVisits");
        b.HasKey(x => new { x.ClubId, x.UserId });
        b.HasIndex(x => new { x.UserId, x.LastVisitedAt });

        b.HasOne(x => x.Club).WithMany().HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubSeatConfiguration : IEntityTypeConfiguration<ClubSeat>
{
    public void Configure(EntityTypeBuilder<ClubSeat> b)
    {
        b.ToTable("ClubSeats");
        b.HasKey(x => new { x.ClubId, x.SeatIndex });
        b.HasIndex(x => x.UserId);

        b.HasOne(x => x.Club).WithMany(c => c.Seats).HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubBanConfiguration : IEntityTypeConfiguration<ClubBan>
{
    public void Configure(EntityTypeBuilder<ClubBan> b)
    {
        b.ToTable("ClubBans");
        b.HasKey(x => x.Id);
        b.Property(x => x.Reason).HasMaxLength(256);
        b.HasIndex(x => new { x.ClubId, x.UserId }).IsUnique();

        b.HasOne(x => x.Club).WithMany().HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ByUser).WithMany().HasForeignKey(x => x.ByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubMessageConfiguration : IEntityTypeConfiguration<ClubMessage>
{
    public void Configure(EntityTypeBuilder<ClubMessage> b)
    {
        b.ToTable("ClubMessages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Text).HasMaxLength(1000).IsRequired();

        // Keyset pagination: newest first within a club.
        b.HasIndex(x => new { x.ClubId, x.Id }).IsDescending(false, true);

        b.HasOne(x => x.Club).WithMany().HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Sender).WithMany().HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ClubItemConfiguration : IEntityTypeConfiguration<ClubItem>
{
    public void Configure(EntityTypeBuilder<ClubItem> b)
    {
        b.ToTable("ClubItems");
        b.HasKey(x => new { x.ClubId, x.ItemId });

        b.HasOne(x => x.Club).WithMany(c => c.Items).HasForeignKey(x => x.ClubId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
    }
}
