using Mehfil.Core.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfil.Api.Controllers;

[Authorize]
public sealed class NotificationsController(INotificationService notifications) : ApiControllerBase
{
    /// <summary>Newest first, with the unread count.</summary>
    [HttpGet]
    [ProducesResponseType<NotificationListDto>(StatusCodes.Status200OK)]
    public Task<NotificationListDto> List([FromQuery] int? page = null, [FromQuery] int? pageSize = null, CancellationToken ct = default) =>
        notifications.ListAsync(CurrentUserId, page, pageSize, ct);

    /// <summary>Marks one notification read. Returns the remaining unread count.</summary>
    [HttpPost("{id:long}/read")]
    [ProducesResponseType<int>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<int> MarkRead(long id, CancellationToken ct) => notifications.MarkReadAsync(CurrentUserId, id, ct);

    /// <summary>Marks everything read.</summary>
    [HttpPost("read-all")]
    [ProducesResponseType<int>(StatusCodes.Status200OK)]
    public Task<int> MarkAllRead(CancellationToken ct) => notifications.MarkAllReadAsync(CurrentUserId, ct);

    /// <summary>Push preferences.</summary>
    [HttpGet("settings")]
    [ProducesResponseType<NotificationSettingsDto>(StatusCodes.Status200OK)]
    public Task<NotificationSettingsDto> Settings(CancellationToken ct) => notifications.GetSettingsAsync(CurrentUserId, ct);

    [HttpPut("settings")]
    [ProducesResponseType<NotificationSettingsDto>(StatusCodes.Status200OK)]
    public Task<NotificationSettingsDto> UpdateSettings([FromBody] UpdateNotificationSettingsRequest request, CancellationToken ct) =>
        notifications.UpdateSettingsAsync(CurrentUserId, request, ct);
}
