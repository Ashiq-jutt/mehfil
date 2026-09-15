using FluentValidation;
using Mehfil.Core.Moderation;
using Mehfil.Core.Notifications;

namespace Mehfil.Api.Validators;

public sealed class RegisterDeviceRequestValidator : AbstractValidator<RegisterDeviceRequest>
{
    public RegisterDeviceRequestValidator()
    {
        RuleFor(x => x.Platform).IsInEnum();
        RuleFor(x => x.Token).NotEmpty().MaximumLength(512);
    }
}

public sealed class UnregisterDeviceRequestValidator : AbstractValidator<UnregisterDeviceRequest>
{
    public UnregisterDeviceRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty().MaximumLength(512);
    }
}

public sealed class ResolveReportRequestValidator : AbstractValidator<ResolveReportRequest>
{
    public ResolveReportRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Action).Must(a => a is null || ReportActions.All.Contains(a)).WithMessage($"Action must be one of: {string.Join(", ", ReportActions.All)}.");
    }
}
