using FluentValidation;
using Mehfil.Core.Moderation;
using Mehfil.Infrastructure.Moderation;

namespace Mehfil.Api.Validators;

public sealed class CreateReportRequestValidator : AbstractValidator<CreateReportRequest>
{
    public CreateReportRequestValidator()
    {
        RuleFor(x => x.TargetType).IsInEnum();
        RuleFor(x => x.TargetId).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Reason).NotEmpty().Must(ReportReasons.IsValid).WithMessage("Choose one of the listed reasons.");
        RuleFor(x => x.Details).MaximumLength(ReportService.DetailsMax);
    }
}
