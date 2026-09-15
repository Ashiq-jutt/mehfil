using Mehfil.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mehfil.Infrastructure.Data.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("Users");
        b.HasKey(x => x.Id);

        b.Property(x => x.PublicId).HasMaxLength(16).IsRequired();
        b.HasIndex(x => x.PublicId).IsUnique();

        b.Property(x => x.GoogleSubject).HasMaxLength(128).IsRequired();
        b.HasIndex(x => x.GoogleSubject).IsUnique();

        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.HasIndex(x => x.Email).IsUnique();

        b.Property(x => x.DisplayName).HasMaxLength(64).IsRequired();
        b.Property(x => x.AvatarUrl).HasMaxLength(512);
        b.Property(x => x.Signature).HasMaxLength(120);
        b.Property(x => x.CountryCode).HasMaxLength(2).IsFixedLength();

        b.Property(x => x.RowVersion).IsRowVersion();

        b.HasIndex(x => x.HeartsGifted);
        b.HasIndex(x => x.HeartsReceived);
        b.HasIndex(x => x.RoyaltyPoints);
        b.HasIndex(x => new { x.Status, x.IsOnline });

        b.HasOne(x => x.Country)
            .WithMany()
            .HasForeignKey(x => x.CountryCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(88).IsRequired();
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(88);
        b.Property(x => x.CreatedByIp).HasMaxLength(64);
        b.Property(x => x.DeviceName).HasMaxLength(128);
        b.HasIndex(x => new { x.UserId, x.ExpiresAt });

        b.HasOne(x => x.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class DeviceTokenConfiguration : IEntityTypeConfiguration<DeviceToken>
{
    public void Configure(EntityTypeBuilder<DeviceToken> b)
    {
        b.ToTable("DeviceTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.FcmToken).HasMaxLength(512).IsRequired();
        b.HasIndex(x => x.FcmToken).IsUnique();
        b.HasIndex(x => x.UserId);

        b.HasOne(x => x.User)
            .WithMany(u => u.DeviceTokens)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class AchievementConfiguration : IEntityTypeConfiguration<Achievement>
{
    public void Configure(EntityTypeBuilder<Achievement> b)
    {
        b.ToTable("Achievements");
        b.HasKey(x => new { x.UserId, x.Kind });

        b.HasOne(x => x.User)
            .WithMany(u => u.Achievements)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
