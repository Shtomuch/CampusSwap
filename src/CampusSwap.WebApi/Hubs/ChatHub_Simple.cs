using System.Security.Claims;
using CampusSwap.Application.Features.Chat.Commands;
using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CampusSwap.WebApi.Hubs;

[Authorize]
public class ChatHubSimple : Hub
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ChatHubSimple> _logger;
    private static readonly Dictionary<string, string> _userConnections = new();

    public ChatHubSimple(IMediator mediator, ICurrentUserService currentUserService, INotificationService notificationService, ILogger<ChatHubSimple> logger)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            Console.WriteLine($"[ChatHubSimple] ✅ User {userId} connected with connection {Context.ConnectionId}");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId) && _userConnections.ContainsKey(userId))
        {
            _userConnections.Remove(userId);
            Console.WriteLine($"[ChatHubSimple] ✅ User {userId} disconnected");
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string recipientId, string message)
    {
        Console.WriteLine($"[ChatHubSimple.SendMessage] ⭐ METHOD CALLED!");
        Console.WriteLine($"[ChatHubSimple.SendMessage] RecipientId: {recipientId}");
        Console.WriteLine($"[ChatHubSimple.SendMessage] Message: {message}");

        try
        {
            var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"[ChatHubSimple.SendMessage] SenderId: {senderId}");

            if (string.IsNullOrEmpty(senderId))
            {
                Console.WriteLine($"[ChatHubSimple.SendMessage] ❌ User not authenticated");
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            if (string.IsNullOrEmpty(message) || string.IsNullOrEmpty(recipientId))
            {
                Console.WriteLine($"[ChatHubSimple.SendMessage] ❌ Invalid parameters");
                await Clients.Caller.SendAsync("Error", "Invalid parameters");
                return;
            }

            if (!Guid.TryParse(recipientId, out var recipientGuid))
            {
                Console.WriteLine($"[ChatHubSimple.SendMessage] ❌ Invalid recipient ID format");
                await Clients.Caller.SendAsync("Error", "Invalid recipient ID format");
                return;
            }

            Console.WriteLine($"[ChatHubSimple.SendMessage] ✅ Creating command...");
            
            var command = new SendMessageCommand
            {
                ReceiverId = recipientGuid,
                Content = message
            };

            Console.WriteLine($"[ChatHubSimple.SendMessage] ✅ Sending to MediatR...");
            
            var messageDto = await _mediator.Send(command);
            
            Console.WriteLine($"[ChatHubSimple.SendMessage] ✅ Message sent successfully: {messageDto.Id}");

            // Send confirmation to sender
            await Clients.Caller.SendAsync("MessageSent", messageDto);
            
            Console.WriteLine($"[ChatHubSimple.SendMessage] 🎉 Completed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ChatHubSimple.SendMessage] 💥 ERROR: {ex.Message}");
            Console.WriteLine($"[ChatHubSimple.SendMessage] 💥 Stack: {ex.StackTrace}");
            await Clients.Caller.SendAsync("Error", $"Error: {ex.Message}");
            throw; // Re-throw to let SignalR handle it
        }
    }
}
