using Mehfil.Core.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class StoreController(IStoreService store) : ApiControllerBase
{
    /// <summary>All Club Store items with the caller's ownership / equipped / locked state, plus per-kind badge counts.</summary>
    [HttpGet]
    [ProducesResponseType<StoreDto>(StatusCodes.Status200OK)]
    public Task<StoreDto> Get(CancellationToken ct) => store.GetAsync(CurrentUserId, ct);

    /// <summary>Equip an unlocked item. Backgrounds and club DPs apply to the caller's own club.</summary>
    [HttpPost("items/{code}/equip")]
    [ProducesResponseType<EquipResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<EquipResultDto> Equip(string code, CancellationToken ct) => store.EquipAsync(CurrentUserId, code, ct);

    /// <summary>Buy a hearts-priced item.</summary>
    [HttpPost("items/{code}/buy")]
    [ProducesResponseType<BuyResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<BuyResultDto> Buy(string code, CancellationToken ct) => store.BuyAsync(CurrentUserId, code, ct);
}
