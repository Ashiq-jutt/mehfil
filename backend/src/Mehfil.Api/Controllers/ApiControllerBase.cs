using Mehfil.Api.Extensions;
using Mehfil.Core.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    protected long CurrentUserId => User.GetUserId();

    protected AuthContext CurrentAuthContext(string? deviceName = null) => new(
        HttpContext.Connection.RemoteIpAddress?.ToString(),
        deviceName ?? Request.Headers.UserAgent.ToString());
}
