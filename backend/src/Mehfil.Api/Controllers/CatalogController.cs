using Mehfil.Core.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

/// <summary>Seeded reference data used by pickers and filters.</summary>
[Authorize]
public sealed class CatalogController(ICatalogService catalog) : ApiControllerBase
{
    [HttpGet("countries")]
    [ProducesResponseType<IReadOnlyList<CountryDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<CountryDto>> Countries(CancellationToken ct) => catalog.GetCountriesAsync(ct);

    [HttpGet("club-categories")]
    [ProducesResponseType<IReadOnlyList<ClubCategoryDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<ClubCategoryDto>> ClubCategories(CancellationToken ct) => catalog.GetClubCategoriesAsync(ct);
}
