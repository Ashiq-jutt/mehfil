using FluentValidation;
using Mehfil.Core.Clubs;
using Mehfil.Infrastructure.Clubs;

namespace Mehfil.Api.Validators;

public sealed class CreateClubRequestValidator : AbstractValidator<CreateClubRequest>
{
    public CreateClubRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Must(v => v.Trim().Length is >= ClubService.NameMin and <= ClubService.NameMax)
            .WithMessage($"Club name must be {ClubService.NameMin}-{ClubService.NameMax} characters.");
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.CountryCode).Must(v => v is null || v.Trim().Length is 0 or 2 || v.Trim().Equals("GLOBAL", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Country code must be a 2-letter ISO code.");
        RuleFor(x => x.Language).MaximumLength(ClubService.LanguageMax);
        RuleFor(x => x.Announcement).MaximumLength(ClubService.AnnouncementMax);
    }
}

public sealed class UpdateClubRequestValidator : AbstractValidator<UpdateClubRequest>
{
    public UpdateClubRequestValidator()
    {
        RuleFor(x => x.Name).Must(v => v is null || v.Trim().Length is >= ClubService.NameMin and <= ClubService.NameMax)
            .WithMessage($"Club name must be {ClubService.NameMin}-{ClubService.NameMax} characters.");
        RuleFor(x => x.CategoryId).Must(v => v is null or > 0);
        RuleFor(x => x.CountryCode).Must(v => v is null || v.Trim().Length is 0 or 2 || v.Trim().Equals("GLOBAL", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Country code must be a 2-letter ISO code.");
        RuleFor(x => x.Language).MaximumLength(ClubService.LanguageMax);
        RuleFor(x => x.Announcement).MaximumLength(ClubService.AnnouncementMax);
    }
}
