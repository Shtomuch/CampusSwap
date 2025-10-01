using CampusSwap.Application.Features.Notifications.Commands;
using CampusSwap.Application.Features.Notifications.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetNotifications(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null,
        [FromQuery] string? type = null)
    {
        var query = new GetNotificationsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            IsRead = isRead,
            Type = type
        };

        var notifications = await _mediator.Send(query);
        return Ok(notifications);
    }

    [HttpGet("unread-counts")]
    public async Task<ActionResult<UnreadCountsDto>> GetUnreadCounts()
    {
        var query = new GetUnreadNotificationCountQuery();
        var counts = await _mediator.Send(query);
        return Ok(counts);
    }

    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var command = new MarkNotificationAsReadCommand
        {
            NotificationId = notificationId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] string? type = null)
    {
        var command = new MarkAllNotificationsAsReadCommand
        {
            Type = type
        };

        await _mediator.Send(command);
        return NoContent();
    }
}
