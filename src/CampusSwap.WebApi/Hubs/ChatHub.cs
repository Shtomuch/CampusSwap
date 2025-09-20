using System.Security.Claims;
using CampusSwap.Application.Features.Chat.Commands;
using CampusSwap.Application.Features.Chat.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CampusSwap.WebApi.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMediator _mediator;
    private readonly ILogger<ChatHub> _logger;
    private static readonly Dictionary<string, string> _userConnections = new();

    public ChatHub(IMediator mediator, ILogger<ChatHub> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            await Clients.All.SendAsync("UserConnected", userId);
            _logger.LogInformation("User {UserId} connected to chat", userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId) && _userConnections.ContainsKey(userId))
        {
            _userConnections.Remove(userId);
            await Clients.All.SendAsync("UserDisconnected", userId);
            _logger.LogInformation("User {UserId} disconnected from chat", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string recipientId, string message, string? listingId = null)
    {
        var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(senderId))
        {
            await Clients.Caller.SendAsync("Error", "User not authenticated");
            return;
        }

        var command = new SendMessageCommand
        {
            RecipientId = Guid.Parse(recipientId),
            Content = message,
            ListingId = string.IsNullOrEmpty(listingId) ? null : Guid.Parse(listingId)
        };

        try
        {
            var messageDto = await _mediator.Send(command);
            
            // Send to recipient if online
            if (_userConnections.ContainsKey(recipientId))
            {
                await Clients.Client(_userConnections[recipientId])
                    .SendAsync("ReceiveMessage", messageDto);
            }
            
            // Send confirmation to sender
            await Clients.Caller.SendAsync("MessageSent", messageDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message from {SenderId} to {RecipientId}", senderId, recipientId);
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

    public async Task GetMessages(string conversationId)
    {
        try
        {
            var messages = await _mediator.Send(new GetConversationMessagesQuery 
            { 
                ConversationId = Guid.Parse(conversationId) 
            });
            
            await Clients.Caller.SendAsync("MessagesLoaded", messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading messages");
            await Clients.Caller.SendAsync("Error", "Failed to load messages");
        }
    }

    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        await Clients.Caller.SendAsync("JoinedConversation", conversationId);
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