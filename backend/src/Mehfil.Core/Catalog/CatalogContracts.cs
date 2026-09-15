namespace Mehfil.Core.Catalog;

public sealed record CountryDto(string Code, string Name, string FlagEmoji, bool IsFeatured);

public sealed record ClubCategoryDto(long Id, string Code, string Name);

public interface ICatalogService
{
    Task<IReadOnlyList<CountryDto>> GetCountriesAsync(CancellationToken ct);
    Task<IReadOnlyList<ClubCategoryDto>> GetClubCategoriesAsync(CancellationToken ct);
}
