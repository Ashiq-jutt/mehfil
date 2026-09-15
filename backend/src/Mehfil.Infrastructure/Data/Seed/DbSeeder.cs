using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Data.Seed;

/// <summary>
/// Idempotent catalog seeding keyed by stable codes. Safe to run on every startup:
/// new rows are inserted, existing rows are updated to the seed definition, nothing is deleted.
/// </summary>
public sealed class DbSeeder(MehfilDbContext db, IClock clock, ILogger<DbSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct)
    {
        var inserted = 0;
        inserted += await UpsertAsync(db.Countries, SeedData.Countries(), c => c.Code, (dst, src) =>
        {
            dst.Name = src.Name;
            dst.FlagEmoji = src.FlagEmoji;
            dst.IsFeatured = src.IsFeatured;
            dst.SortOrder = src.SortOrder;
        }, ct);

        inserted += await UpsertAsync(db.ClubCategories, SeedData.Categories(), c => c.Code, (dst, src) =>
        {
            dst.Name = src.Name;
            dst.SortOrder = src.SortOrder;
        }, ct);

        inserted += await UpsertAsync(db.Gifts, SeedData.Gifts(), g => g.Code, (dst, src) =>
        {
            dst.Name = src.Name;
            dst.IconUrl = src.IconUrl;
            dst.AnimationUrl = src.AnimationUrl;
            dst.HeartsPrice = src.HeartsPrice;
            dst.IsActive = src.IsActive;
            dst.SortOrder = src.SortOrder;
        }, ct);

        inserted += await UpsertAsync(db.HeartsPackages, SeedData.Packages(), p => p.Code, (dst, src) =>
        {
            dst.Name = src.Name;
            dst.Hearts = src.Hearts;
            dst.PriceMinor = src.PriceMinor;
            dst.Currency = src.Currency;
            dst.RoyaltyPoints = src.RoyaltyPoints;
            dst.IconUrl = src.IconUrl;
            dst.StoreProductIdAndroid = src.StoreProductIdAndroid;
            dst.StoreProductIdIos = src.StoreProductIdIos;
            dst.IsBest = src.IsBest;
            dst.IsWelcomeOffer = src.IsWelcomeOffer;
            dst.BonusGiftsJson = src.BonusGiftsJson;
            dst.IsActive = src.IsActive;
            dst.SortOrder = src.SortOrder;
        }, ct);

        inserted += await UpsertAsync(db.StoreItems, SeedData.StoreItems(), s => s.Code, (dst, src) =>
        {
            dst.Kind = src.Kind;
            dst.Name = src.Name;
            dst.AssetUrl = src.AssetUrl;
            dst.PreviewUrl = src.PreviewUrl;
            dst.UnlockRule = src.UnlockRule;
            dst.UnlockValue = src.UnlockValue;
            dst.UnlockBoard = src.UnlockBoard;
            dst.UnlockLabel = src.UnlockLabel;
            dst.HeartsPrice = src.HeartsPrice;
            dst.IsActive = src.IsActive;
            dst.SortOrder = src.SortOrder;
        }, ct);

        var changed = await db.SaveChangesAsync(ct);
        logger.LogInformation("Seed complete at {Now}: {Inserted} inserted, {Changed} rows written", clock.UtcNow, inserted, changed);
    }

    private static async Task<int> UpsertAsync<T>(
        DbSet<T> set,
        IEnumerable<T> seed,
        Func<T, string> key,
        Action<T, T> update,
        CancellationToken ct) where T : class
    {
        var existing = await set.ToDictionaryAsync(key, ct);
        var inserted = 0;
        foreach (var item in seed)
        {
            if (existing.TryGetValue(key(item), out var current))
            {
                update(current, item);
            }
            else
            {
                set.Add(item);
                inserted++;
            }
        }

        return inserted;
    }
}
