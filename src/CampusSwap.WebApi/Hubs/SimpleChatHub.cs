using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace CampusSwap.WebApi.Hubs;

[Authorize]
public class SimpleChatHub : Hub
{
    private static readonly Dictionary<string, string> _userConnections = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            Console.WriteLine($"[SimpleChatHub] ✅ User {userId} connected with connection {Context.ConnectionId}");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId) && _userConnections.ContainsKey(userId))
        {
            _userConnections.Remove(userId);
            Console.WriteLine($"[SimpleChatHub] ✅ User {userId} disconnected");
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string recipientId, string message)
    {
        Console.WriteLine($"[SimpleChatHub.SendMessage] ⭐ METHOD CALLED!");
        Console.WriteLine($"[SimpleChatHub.SendMessage] RecipientId: {recipientId}");
        Console.WriteLine($"[SimpleChatHub.SendMessage] Message: {message}");

        try
        {
            var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"[SimpleChatHub.SendMessage] SenderId: {senderId}");

            if (string.IsNullOrEmpty(senderId))
            {
                Console.WriteLine($"[SimpleChatHub.SendMessage] ❌ User not authenticated");
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            if (string.IsNullOrEmpty(message) || string.IsNullOrEmpty(recipientId))
            {
                Console.WriteLine($"[SimpleChatHub.SendMessage] ❌ Invalid parameters");
                await Clients.Caller.SendAsync("Error", "Invalid parameters");
                return;
            }

            // Створюємо простий об'єкт повідомлення
            var messageObj = new
            {
                Id = Guid.NewGuid().ToString(),
                SenderId = senderId,
                ReceiverId = recipientId,
                Content = message,
                SentAt = DateTime.UtcNow,
                SenderName = "User " + senderId.Substring(0, 8)
            };

            Console.WriteLine($"[SimpleChatHub.SendMessage] ✅ Message created: {messageObj.Id}");

            // Відправляємо підтвердження відправнику
            await Clients.Caller.SendAsync("MessageSent", messageObj);
            Console.WriteLine($"[SimpleChatHub.SendMessage] ✅ Confirmation sent to sender");

            // Відправляємо повідомлення отримувачу, якщо він онлайн
            if (_userConnections.ContainsKey(recipientId))
            {
                Console.WriteLine($"[SimpleChatHub.SendMessage] ✅ Recipient {recipientId} is online, sending message");
                await Clients.Client(_userConnections[recipientId]).SendAsync("ReceiveMessage", messageObj);
                Console.WriteLine($"[SimpleChatHub.SendMessage] ✅ Message sent to recipient");
            }
            else
            {
                Console.WriteLine($"[SimpleChatHub.SendMessage] ⚠️ Recipient {recipientId} is not online");
            }
            
            Console.WriteLine($"[SimpleChatHub.SendMessage] 🎉 SendMessage completed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SimpleChatHub.SendMessage] 💥 ERROR: {ex.Message}");
            Console.WriteLine($"[SimpleChatHub.SendMessage] 💥 Stack: {ex.StackTrace}");
            await Clients.Caller.SendAsync("Error", $"Error: {ex.Message}");
            throw; // Re-throw to let SignalR handle it properly
        }
    }

    public async Task GetConversations()
    {
        Console.WriteLine($"[SimpleChatHub.GetConversations] ⭐ METHOD CALLED!");
        
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"[SimpleChatHub.GetConversations] UserId: {userId}");

            if (string.IsNullOrEmpty(userId))
            {
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            // Повертаємо пустий список розмов для простоти
            var conversations = new List<object>();
            
            await Clients.Caller.SendAsync("ConversationsLoaded", conversations);
            Console.WriteLine($"[SimpleChatHub.GetConversations] ✅ Conversations sent");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SimpleChatHub.GetConversations] 💥 ERROR: {ex.Message}");
            await Clients.Caller.SendAsync("Error", $"Error: {ex.Message}");
        }
    }
}
