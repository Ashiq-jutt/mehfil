using Mehfil.Core.Catalog;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Mehfil.Infrastructure.Catalog;

/// <summary>Read-only seeded catalogs, cached in memory (they change only via seeding).</summary>
public sealed class CatalogService(MehfilDbContext db, IMemoryCache cache) : ICatalogService
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);

    public Task<IReadOnlyList<CountryDto>> GetCountriesAsync(CancellationToken ct) =>
        cache.GetOrCreateAsync("catalog:countries", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheFor;
            IReadOnlyList<CountryDto> list = await db.Countries.AsNoTracking()
                .OrderByDescending(c => c.IsFeatured)
                .ThenBy(c => c.IsFeatured ? c.SortOrder : int.MaxValue)
                .ThenBy(c => c.Name)
                .Select(c => new CountryDto(c.Code, c.Name, c.FlagEmoji, c.IsFeatured))
                .ToListAsync(ct);
            return list;
        })!;

    public Task<IReadOnlyList<ClubCategoryDto>> GetClubCategoriesAsync(CancellationToken ct) =>
        cache.GetOrCreateAsync("catalog:club-categories", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheFor;
            IReadOnlyList<ClubCategoryDto> list = await db.ClubCategories.AsNoTracking()
                .OrderBy(c => c.SortOrder)
                .Select(c => new ClubCategoryDto(c.Id, c.Code, c.Name))
                .ToListAsync(ct);
            return list;
        })!;
}
