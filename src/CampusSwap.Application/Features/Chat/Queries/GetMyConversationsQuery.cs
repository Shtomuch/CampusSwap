using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Application.Features.Chat.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Chat.Queries;

public class ConversationDto
{
    public Guid Id { get; set; }
    public Guid OtherUserId { get; set; }
    public string OtherUserName { get; set; } = string.Empty;
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public DateTime LastMessageAt { get; set; }
}

public class GetMyConversationsQuery : IRequest<List<ConversationDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetMyConversationsQueryHandler : IRequestHandler<GetMyConversationsQuery, List<ConversationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyConversationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<ConversationDto>> Handle(GetMyConversationsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var conversations = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages)
            .Where(c => (c.User1Id == currentUserId || c.User2Id == currentUserId) && c.IsActive)
            .OrderByDescending(c => c.LastMessageAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var conversationDtos = new List<ConversationDto>();

        foreach (var conversation in conversations)
        {
            // Determine the other user in the conversation
            var otherUser = conversation.User1Id == currentUserId ? conversation.User2 : conversation.User1;

            // Get the last message
            var lastMessage = conversation.Messages
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();

            // Count unread messages for current user
            var unreadCount = conversation.Messages
                .Count(m => m.ReceiverId == currentUserId && !m.IsRead);

            var conversationDto = new ConversationDto
            {
                Id = conversation.Id,
                OtherUserId = otherUser.Id,
                OtherUserName = otherUser.FullName,
                LastMessage = lastMessage != null ? new MessageDto
                {
                    Id = lastMessage.Id,
                    SenderId = lastMessage.SenderId,
                    SenderName = lastMessage.SenderId == currentUserId ? "You" : otherUser.FullName,
                    ReceiverId = lastMessage.ReceiverId,
                    ReceiverName = lastMessage.ReceiverId == currentUserId ? "You" : otherUser.FullName,
                    Content = lastMessage.Content,
                    SentAt = lastMessage.CreatedAt,
                    IsRead = lastMessage.IsRead
                } : null,
                UnreadCount = unreadCount,
                LastMessageAt = conversation.LastMessageAt
            };

            conversationDtos.Add(conversationDto);
        }

        return conversationDtos;
    }
}