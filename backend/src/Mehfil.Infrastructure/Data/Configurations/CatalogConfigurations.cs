using Mehfil.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mehfil.Infrastructure.Data.Configurations;

public sealed class CountryConfiguration : IEntityTypeConfiguration<Country>
{
    public void Configure(EntityTypeBuilder<Country> b)
    {
        b.ToTable("Countries");
        b.HasKey(x => x.Code);
        b.Property(x => x.Code).HasMaxLength(2).IsFixedLength();
        b.Property(x => x.Name).HasMaxLength(64).IsRequired();
        b.Property(x => x.FlagEmoji).HasMaxLength(8).IsRequired();
        b.HasIndex(x => new { x.IsFeatured, x.SortOrder });
    }
}

public sealed class ClubCategoryConfiguration : IEntityTypeConfiguration<ClubCategory>
{
    public void Configure(EntityTypeBuilder<ClubCategory> b)
    {
        b.ToTable("ClubCategories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(32).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(32).IsRequired();
    }
}

public sealed class GiftConfiguration : IEntityTypeConfiguration<Gift>
{
    public void Configure(EntityTypeBuilder<Gift> b)
    {
        b.ToTable("Gifts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(32).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(64).IsRequired();
        b.Property(x => x.IconUrl).HasMaxLength(512).IsRequired();
        b.Property(x => x.AnimationUrl).HasMaxLength(512);
        b.HasIndex(x => new { x.IsActive, x.SortOrder });
    }
}

public sealed class HeartsPackageConfiguration : IEntityTypeConfiguration<HeartsPackage>
{
    public void Configure(EntityTypeBuilder<HeartsPackage> b)
    {
        b.ToTable("HeartsPackages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(32).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(64).IsRequired();
        b.Property(x => x.Currency).HasMaxLength(3).IsFixedLength().IsRequired();
        b.Property(x => x.IconUrl).HasMaxLength(512);
        b.Property(x => x.StoreProductIdAndroid).HasMaxLength(128);
        b.Property(x => x.StoreProductIdIos).HasMaxLength(128);
        b.Property(x => x.BonusGiftsJson).HasMaxLength(1024);
        b.HasIndex(x => new { x.IsActive, x.SortOrder });
    }
}

public sealed class StoreItemConfiguration : IEntityTypeConfiguration<StoreItem>
{
    public void Configure(EntityTypeBuilder<StoreItem> b)
    {
        b.ToTable("StoreItems");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(48).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssetUrl).HasMaxLength(512).IsRequired();
        b.Property(x => x.PreviewUrl).HasMaxLength(512);
        b.Property(x => x.UnlockLabel).HasMaxLength(64);
        b.HasIndex(x => new { x.Kind, x.IsActive, x.SortOrder });
    }
}
