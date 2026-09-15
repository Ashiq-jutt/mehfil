using FluentValidation;
using Mehfil.Core.Rooms;
using Mehfil.Infrastructure.Rooms;

namespace Mehfil.Api.Validators;

public sealed class SetAnnouncementRequestValidator : AbstractValidator<SetAnnouncementRequest>
{
    public SetAnnouncementRequestValidator()
    {
        RuleFor(x => x.Text).MaximumLength(RoomService.AnnouncementMax);
    }
}

public sealed class BanRequestValidator : AbstractValidator<BanRequest>
{
    public BanRequestValidator()
    {
        RuleFor(x => x.Reason).MaximumLength(256);
    }
}
