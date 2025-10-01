using System.Security.Claims;
using CampusSwap.Application.Features.Chat.Commands;
using CampusSwap.Application.Features.Chat.Queries;
using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CampusSwap.WebApi.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMediator _mediator;
    private readonly ILogger<ChatHub> _logger;
    private readonly INotificationService _notificationService;
    private static readonly Dictionary<string, string> _userConnections = new();

    public ChatHub(IMediator mediator, ILogger<ChatHub> logger, INotificationService notificationService)
    {
        _mediator = mediator;
        _logger = logger;
        _notificationService = notificationService;
    }

    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"[ChatHub.OnConnectedAsync] 🔗 New connection: {Context.ConnectionId}");
        Console.WriteLine($"[ChatHub.OnConnectedAsync] 👤 User authenticated: {Context.User?.Identity?.IsAuthenticated}");
        
        if (Context.User?.Claims != null)
        {
            Console.WriteLine($"[ChatHub.OnConnectedAsync] 🔍 User claims:");
            foreach (var claim in Context.User.Claims)
            {
                Console.WriteLine($"[ChatHub.OnConnectedAsync]   {claim.Type}: {claim.Value}");
            }
        }

        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[ChatHub.OnConnectedAsync] 🆔 User ID: {userId}");
        
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            Console.WriteLine($"[ChatHub.OnConnectedAsync] ✅ User {userId} connected with connection {Context.ConnectionId}");
            await Clients.All.SendAsync("UserConnected", userId);
            await Clients.All.SendAsync("userconnected", userId); // Додаємо з маленької літери для сумісності
            _logger.LogInformation("User {UserId} connected to chat", userId);
        }
        else
        {
            Console.WriteLine($"[ChatHub.OnConnectedAsync] ❌ No user ID found in claims");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[ChatHub.OnDisconnectedAsync] 🔌 Connection disconnected: {Context.ConnectionId}");
        Console.WriteLine($"[ChatHub.OnDisconnectedAsync] ⚠️ Exception: {exception?.Message}");
        
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[ChatHub.OnDisconnectedAsync] 🆔 User ID: {userId}");
        
        if (!string.IsNullOrEmpty(userId) && _userConnections.ContainsKey(userId))
        {
            _userConnections.Remove(userId);
            Console.WriteLine($"[ChatHub.OnDisconnectedAsync] ✅ User {userId} disconnected and removed from connections");
            await Clients.All.SendAsync("UserDisconnected", userId);
            _logger.LogInformation("User {UserId} disconnected from chat", userId);
        }
        else
        {
            Console.WriteLine($"[ChatHub.OnDisconnectedAsync] ⚠️ User {userId} not found in connections or no user ID");
        }
        await base.OnDisconnectedAsync(exception);
    }

        public async Task SendMessage(string recipientId, string message, string? listingId = null)
        {
            Console.WriteLine($"[ChatHub.SendMessage] ⭐ METHOD CALLED! Entry point reached");
            Console.WriteLine($"[ChatHub.SendMessage] ⭐ Parameters: recipientId={recipientId}, message='{message}', listingId={listingId}");
            Console.WriteLine($"[ChatHub.SendMessage] ⭐ ConnectionId: {Context.ConnectionId}");
            Console.WriteLine($"[ChatHub.SendMessage] ⭐ User identity: {Context.User?.Identity?.Name}");

            try
            {
                Console.WriteLine($"[ChatHub.SendMessage] 🚀 Starting SendMessage...");
                Console.WriteLine($"[ChatHub.SendMessage] 📝 RecipientId: {recipientId}");
                Console.WriteLine($"[ChatHub.SendMessage] 💬 Message: {message}");
                Console.WriteLine($"[ChatHub.SendMessage] 🏷️ ListingId: {listingId}");
                Console.WriteLine($"[ChatHub.SendMessage] 🔗 ConnectionId: {Context.ConnectionId}");

                var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Console.WriteLine($"[ChatHub.SendMessage] 👤 SenderId from token: {senderId}");
                
                // Логуємо всі claims користувача
                if (Context.User?.Claims != null)
                {
                    Console.WriteLine($"[ChatHub.SendMessage] 🔍 User claims:");
                    foreach (var claim in Context.User.Claims)
                    {
                        Console.WriteLine($"[ChatHub.SendMessage]   {claim.Type}: {claim.Value}");
                    }
                }

                if (string.IsNullOrEmpty(senderId))
                {
                    Console.WriteLine($"[ChatHub.SendMessage] ❌ User not authenticated");
                    await Clients.Caller.SendAsync("Error", "User not authenticated");
                    return;
                }

                if (string.IsNullOrEmpty(message) || string.IsNullOrEmpty(recipientId))
                {
                    Console.WriteLine($"[ChatHub.SendMessage] ❌ Invalid message or recipient");
                    await Clients.Caller.SendAsync("Error", "Invalid message or recipient");
                    return;
                }

                if (!Guid.TryParse(recipientId, out var recipientGuid))
                {
                    Console.WriteLine($"[ChatHub.SendMessage] ❌ Invalid recipient ID format: {recipientId}");
                    await Clients.Caller.SendAsync("Error", "Invalid recipient ID format");
                    return;
                }

                if (senderId == recipientId)
                {
                    Console.WriteLine($"[ChatHub.SendMessage] ❌ Cannot send message to yourself");
                    await Clients.Caller.SendAsync("Error", "Cannot send message to yourself");
                    return;
                }

                var command = new SendMessageCommand
                {
                    ReceiverId = recipientGuid,
                    Content = message
                };

                Console.WriteLine($"[ChatHub.SendMessage] ✅ All validations passed, sending command to MediatR");
                _logger.LogInformation("Sending message from {SenderId} to {RecipientId}: {Content}", senderId, recipientId, message);
            
            MessageDto messageDto;
            try
            {
                messageDto = await _mediator.Send(command);
                _logger.LogInformation("Message sent successfully: {MessageId}", messageDto.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send message from {SenderId} to {RecipientId}: {Error}", senderId, recipientId, ex.Message);
                await Clients.Caller.SendAsync("Error", $"Failed to send message: {ex.Message}");
                return;
            }
            
            // Send to recipient if online
            if (_userConnections.ContainsKey(recipientId))
            {
                await Clients.Client(_userConnections[recipientId])
                    .SendAsync("ReceiveMessage", messageDto);
            }
            
            // Create notification for the receiver
            await _notificationService.CreateNotificationAsync(
                recipientGuid,
                "message",
                "Нове повідомлення",
                $"{messageDto.SenderName}: {messageDto.Content}",
                $"/chat/{messageDto.ConversationId}",
                null,
                null,
                messageDto.ConversationId,
                null);
            
            // Send confirmation to sender
            await Clients.Caller.SendAsync("MessageSent", messageDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ChatHub.SendMessage] 💥 EXCEPTION CAUGHT: {ex.GetType().Name}");
            Console.WriteLine($"[ChatHub.SendMessage] 💥 Exception message: {ex.Message}");
            Console.WriteLine($"[ChatHub.SendMessage] 💥 Stack trace: {ex.StackTrace}");

            _logger.LogError(ex, "Error sending message from {SenderId} to {RecipientId}",
                Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value, recipientId);
            await Clients.Caller.SendAsync("Error", "Failed to send message");
        }
    }

    public async Task MarkMessagesAsRead(string conversationId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return;

        try
        {
            await _mediator.Send(new MarkMessagesAsReadCommand 
            { 
                ConversationId = Guid.Parse(conversationId) 
            });
            
            await Clients.Caller.SendAsync("MessagesMarkedAsRead", conversationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read");
        }
    }

    public async Task GetConversations()
    {
        try
        {
            var conversations = await _mediator.Send(new GetMyConversationsQuery());
            await Clients.Caller.SendAsync("ConversationsLoaded", conversations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading conversations");
            await Clients.Caller.SendAsync("Error", "Failed to load conversations");
        }
    }

    public async Task CreateConversation(string otherUserId)
    {
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            if (!Guid.TryParse(otherUserId, out var otherUserGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid user ID format");
                return;
            }

            var command = new CreateConversationCommand
            {
                OtherUserId = otherUserGuid
            };

            var conversation = await _mediator.Send(command);
            await Clients.Caller.SendAsync("ConversationCreated", conversation);
            _logger.LogInformation("Conversation created between {UserId} and {OtherUserId}", userId, otherUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating conversation between {UserId} and {OtherUserId}", 
                Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value, otherUserId);
            await Clients.Caller.SendAsync("Error", "Failed to create conversation");
        }
    }

    public async Task GetMessages(string conversationId)
    {
        try
        {
            if (!Guid.TryParse(conversationId, out var conversationGuid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid conversation ID format");
                return;
            }

            var messages = await _mediator.Send(new GetConversationMessagesQuery
            {
                OtherUserId = conversationGuid
            });
            
            await Clients.Caller.SendAsync("MessagesLoaded", messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading messages for conversation {ConversationId}", conversationId);
            await Clients.Caller.SendAsync("Error", "Failed to load messages");
        }
    }

    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        await Clients.Caller.SendAsync("JoinedConversation", conversationId);
        await Clients.Caller.SendAsync("joinedconversation", conversationId); // Додаємо з маленької літери для сумісності
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        await Clients.Caller.SendAsync("LeftConversation", conversationId);
    }

    public async Task StartTyping(string recipientId)
    {
        var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (_userConnections.ContainsKey(recipientId))
        {
            await Clients.Client(_userConnections[recipientId])
                .SendAsync("UserTyping", senderId);
        }
    }

    public async Task StopTyping(string recipientId)
    {
        var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (_userConnections.ContainsKey(recipientId))
        {
            await Clients.Client(_userConnections[recipientId])
                .SendAsync("UserStoppedTyping", senderId);
        }
    }
}