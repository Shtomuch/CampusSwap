using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using CampusSwap.Application.Features.Notifications.Queries;

namespace CampusSwap.WebApi.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private static readonly Dictionary<string, List<string>> _userConnections = new();

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            if (!_userConnections.ContainsKey(userId))
            {
                _userConnections[userId] = new List<string>();
            }
            _userConnections[userId].Add(Context.ConnectionId);
            _logger.LogInformation("User {UserId} connected to notifications", userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId) && _userConnections.ContainsKey(userId))
        {
            _userConnections[userId].Remove(Context.ConnectionId);
            if (_userConnections[userId].Count == 0)
            {
                _userConnections.Remove(userId);
            }
            _logger.LogInformation("User {UserId} disconnected from notifications", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public static async Task SendNotificationToUser(IHubContext<NotificationHub> hubContext, string userId, NotificationDto notification)
    {
        if (_userConnections.ContainsKey(userId))
        {
            foreach (var connectionId in _userConnections[userId])
            {
                await hubContext.Clients.Client(connectionId).SendAsync("ReceiveNotification", notification);
            }
        }
    }

    public static async Task SendUnreadCountsUpdate(IHubContext<NotificationHub> hubContext, string userId, UnreadCountsDto counts)
    {
        if (_userConnections.ContainsKey(userId))
        {
            foreach (var connectionId in _userConnections[userId])
            {
                await hubContext.Clients.Client(connectionId).SendAsync("UpdateUnreadCounts", counts);
            }
        }
    }

    public static async Task SendListingNotification(IHubContext<NotificationHub> hubContext, string userId, string title, string message, Guid listingId)
    {
        var notification = new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = "listing",
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            ListingId = listingId
        };
        await SendNotificationToUser(hubContext, userId, notification);
    }

    public static async Task SendOrderNotification(IHubContext<NotificationHub> hubContext, string userId, string title, string message, Guid orderId)
    {
        var notification = new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = "order",
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            OrderId = orderId
        };
        await SendNotificationToUser(hubContext, userId, notification);
    }

    public static async Task SendMessageNotification(IHubContext<NotificationHub> hubContext, string userId, string senderName, string messagePreview)
    {
        var notification = new NotificationDto
        {
            Id = Guid.NewGuid(),
            Type = "message",
            Title = "New message",
            Message = $"{senderName}: {messagePreview}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        await SendNotificationToUser(hubContext, userId, notification);
    }
}