using Mehfil.Core.Common;
using Mehfil.Core.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class UsersController(IUserService users) : ApiControllerBase
{
    /// <summary>The signed-in user's own account.</summary>
    [HttpGet("me")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public Task<UserDto> Me(CancellationToken ct) => users.GetMeAsync(CurrentUserId, ct);

    /// <summary>Own profile screen: account, achievements and stats.</summary>
    [HttpGet("me/profile")]
    [ProducesResponseType<ProfileDto>(StatusCodes.Status200OK)]
    public Task<ProfileDto> MyProfile(CancellationToken ct) => users.GetProfileAsync(CurrentUserId, ct);

    /// <summary>Update display name, signature and/or country. Omitted fields are left unchanged.</summary>
    [HttpPatch("me")]
    [ProducesResponseType<ProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<ProfileDto> UpdateMe([FromBody] UpdateProfileRequest request, CancellationToken ct) =>
        users.UpdateProfileAsync(CurrentUserId, request, ct);

    /// <summary>Choose gender. Allowed exactly once; afterwards returns 409 profile.gender_locked.</summary>
    [HttpPut("me/gender")]
    [ProducesResponseType<ProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<ProfileDto> SetGender([FromBody] SetGenderRequest request, CancellationToken ct) =>
        users.SetGenderAsync(CurrentUserId, request.Gender, ct);

    /// <summary>Set birthday (day + month only).</summary>
    [HttpPut("me/birthday")]
    [ProducesResponseType<ProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<ProfileDto> SetBirthday([FromBody] SetBirthdayRequest request, CancellationToken ct) =>
        users.SetBirthdayAsync(CurrentUserId, request.Day, request.Month, ct);

    /// <summary>Upload a profile photo (multipart field "file": JPEG/PNG/WebP, max 5 MB, resized on the device).</summary>
    [HttpPost("me/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [ProducesResponseType<ProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ProfileDto> UploadAvatar(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            throw new BadRequestException("profile.avatar_empty", "Attach an image in the multipart field 'file'.");
        }

        await using var stream = file.OpenReadStream();
        return await users.SetAvatarAsync(CurrentUserId, stream, file.ContentType, ct);
    }

    /// <summary>Another user's player card by public id (e.g. MOBI4875).</summary>
    [HttpGet("{publicId}")]
    [ProducesResponseType<PublicProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<PublicProfileDto> ByPublicId(string publicId, CancellationToken ct) =>
        users.GetPublicProfileAsync(publicId, CurrentUserId, ct);
}
