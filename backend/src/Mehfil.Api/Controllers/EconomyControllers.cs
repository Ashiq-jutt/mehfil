using Mehfil.Core.Economy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class WalletController(IWalletService wallet) : ApiControllerBase
{
    /// <summary>Balance and paged transaction history (newest first).</summary>
    [HttpGet]
    [ProducesResponseType<WalletDto>(StatusCodes.Status200OK)]
    public Task<WalletDto> Get([FromQuery] int? page = null, [FromQuery] int? pageSize = null, CancellationToken ct = default) =>
        wallet.GetAsync(CurrentUserId, page, pageSize, ct);

    /// <summary>Shop packages, welcome offer availability and whether purchases are in sandbox mode.</summary>
    [HttpGet("shop")]
    [ProducesResponseType<ShopDto>(StatusCodes.Status200OK)]
    public Task<ShopDto> Shop(CancellationToken ct) => wallet.GetShopAsync(CurrentUserId, ct);

    /// <summary>Verify a store purchase and credit hearts. Idempotent per (platform, transactionId).</summary>
    [HttpPost("purchases/verify")]
    [ProducesResponseType<PurchaseResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<PurchaseResultDto> Verify([FromBody] VerifyPurchaseRequest request, CancellationToken ct) =>
        wallet.VerifyPurchaseAsync(CurrentUserId, request, ct);

    /// <summary>Development only: grant hearts to yourself for testing gifts.</summary>
    [HttpPost("dev-grant")]
    [ProducesResponseType<WalletDto>(StatusCodes.Status200OK)]
    public Task<WalletDto> DevGrant([FromBody] DevGrantRequest request, CancellationToken ct) => wallet.DevGrantAsync(CurrentUserId, request.Hearts, ct);
}

[Authorize]
public sealed class GiftsController(IGiftService gifts) : ApiControllerBase
{
    /// <summary>Gift catalog with hearts prices.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<GiftDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<GiftDto>> Catalog(CancellationToken ct) => gifts.GetCatalogAsync(ct);
}

[Authorize]
[Route("api/v1/clubs/{publicId}/room")]
public sealed class RoomGiftsController(IGiftService gifts) : ApiControllerBase
{
    /// <summary>Send a gift in the room you are in (to a seated user or to the club).</summary>
    [HttpPost("gifts")]
    [ProducesResponseType<SendGiftResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<SendGiftResultDto> Send(string publicId, [FromBody] SendGiftRequest request, CancellationToken ct) =>
        gifts.SendAsync(CurrentUserId, publicId, request, ct);

    /// <summary>Jar and level progress ("Clubs Levels" modal).</summary>
    [HttpGet("level")]
    [ProducesResponseType<ClubLevelDto>(StatusCodes.Status200OK)]
    public Task<ClubLevelDto> Level(string publicId, CancellationToken ct) => gifts.GetClubLevelAsync(publicId, ct);
}
