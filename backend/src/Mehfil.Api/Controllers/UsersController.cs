using Mehfil.Core.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class UsersController(IUserService users) : ApiControllerBase
{
    /// <summary>The signed-in user's own profile.</summary>
    [HttpGet("me")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public Task<UserDto> Me(CancellationToken ct) => users.GetMeAsync(CurrentUserId, ct);
}
