using FluentValidation;
using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Users;

namespace Mehfil.Api.Validators;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.DisplayName)
            .Must(v => v is null || v.Trim().Length is >= UserService.DisplayNameMin and <= UserService.DisplayNameMax)
            .WithMessage($"Display name must be {UserService.DisplayNameMin}-{UserService.DisplayNameMax} characters.");
        RuleFor(x => x.Signature).MaximumLength(UserService.SignatureMax);
        RuleFor(x => x.CountryCode)
            .Must(v => v is null || v.Trim().Length is 0 or 2)
            .WithMessage("Country code must be a 2-letter ISO code.");
    }
}

public sealed class SetGenderRequestValidator : AbstractValidator<SetGenderRequest>
{
    public SetGenderRequestValidator()
    {
        RuleFor(x => x.Gender).IsInEnum().NotEqual(Gender.Unspecified).WithMessage("Choose Male, Female or Undisclosed.");
    }
}

public sealed class SetBirthdayRequestValidator : AbstractValidator<SetBirthdayRequest>
{
    public SetBirthdayRequestValidator()
    {
        RuleFor(x => x.Month).InclusiveBetween(1, 12);
        RuleFor(x => x.Day).InclusiveBetween(1, 31);
        RuleFor(x => x).Must(x => Birthday.IsValid(x.Day, x.Month))
            .WithName("Day")
            .WithMessage("That day does not exist in the chosen month.");
    }
}
