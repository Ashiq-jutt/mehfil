using Mehfil.Core.Catalog;
using Mehfil.Core.Clubs;
using Mehfil.Core.Moderation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

/// <summary>Seeded / static reference data used by pickers, filters and dialogs.</summary>
[Authorize]
public sealed class CatalogController(ICatalogService catalog) : ApiControllerBase
{
    [HttpGet("countries")]
    [ProducesResponseType<IReadOnlyList<CountryDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<CountryDto>> Countries(CancellationToken ct) => catalog.GetCountriesAsync(ct);

    [HttpGet("club-categories")]
    [ProducesResponseType<IReadOnlyList<ClubCategoryDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<ClubCategoryDto>> ClubCategories(CancellationToken ct) => catalog.GetClubCategoriesAsync(ct);

    /// <summary>Community rules shown in Club Info → Rules.</summary>
    [HttpGet("club-rules")]
    [ProducesResponseType<IReadOnlyList<ClubRuleDto>>(StatusCodes.Status200OK)]
    public IReadOnlyList<ClubRuleDto> ClubRules() => Core.Clubs.ClubRules.All;

    /// <summary>Reasons offered in the Report dialog.</summary>
    [HttpGet("report-reasons")]
    [ProducesResponseType<IReadOnlyList<ReportReasonDto>>(StatusCodes.Status200OK)]
    public IReadOnlyList<ReportReasonDto> ReportReasons() => Core.Moderation.ReportReasons.All;
}
