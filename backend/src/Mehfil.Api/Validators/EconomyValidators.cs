using FluentValidation;
using Mehfil.Core.Economy;
using Mehfil.Infrastructure.Economy;

namespace Mehfil.Api.Validators;

public sealed class VerifyPurchaseRequestValidator : AbstractValidator<VerifyPurchaseRequest>
{
    public VerifyPurchaseRequestValidator()
    {
        RuleFor(x => x.Platform).IsInEnum();
        RuleFor(x => x.ProductId).NotEmpty().MaximumLength(128);
        RuleFor(x => x.TransactionId).NotEmpty().MaximumLength(256);
    }
}

public sealed class SendGiftRequestValidator : AbstractValidator<SendGiftRequest>
{
    public SendGiftRequestValidator()
    {
        RuleFor(x => x.GiftCode).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Quantity).InclusiveBetween(1, GiftService.MaxQuantity);
        RuleFor(x => x.ReceiverId).MaximumLength(16);
    }
}

public sealed class DevGrantRequestValidator : AbstractValidator<DevGrantRequest>
{
    public DevGrantRequestValidator()
    {
        RuleFor(x => x.Hearts).InclusiveBetween(1, WalletService.DevGrantMax);
    }
}
