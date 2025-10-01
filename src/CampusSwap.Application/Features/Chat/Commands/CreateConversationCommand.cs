using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Chat.Commands;

public class CreateConversationCommand : IRequest<ConversationDto>
{
    public Guid OtherUserId { get; set; }
}

public class ConversationDto
{
    public Guid Id { get; set; }
    public Guid OtherUserId { get; set; }
    public string OtherUserName { get; set; } = string.Empty;
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}

public class CreateConversationCommandHandler : IRequestHandler<CreateConversationCommand, ConversationDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateConversationCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ConversationDto> Handle(CreateConversationCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var otherUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.OtherUserId, cancellationToken)
            ?? throw new InvalidOperationException("Other user not found");

        // Check if conversation already exists
        var existingConversation = await _context.Conversations
            .FirstOrDefaultAsync(c =>
                (c.User1Id == currentUserId && c.User2Id == request.OtherUserId) ||
                (c.User1Id == request.OtherUserId && c.User2Id == currentUserId),
                cancellationToken);

        if (existingConversation != null)
        {
            return new ConversationDto
            {
                Id = existingConversation.Id,
                OtherUserId = request.OtherUserId,
                OtherUserName = otherUser.FullName,
                LastMessage = null,
                LastMessageAt = existingConversation.LastMessageAt,
                UnreadCount = 0
            };
        }

        // Create new conversation
        var conversation = new Conversation
        {
            User1Id = currentUserId,
            User2Id = request.OtherUserId
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync(cancellationToken);

        return new ConversationDto
        {
            Id = conversation.Id,
            OtherUserId = request.OtherUserId,
            OtherUserName = otherUser.FullName,
            LastMessage = null,
            LastMessageAt = null,
            UnreadCount = 0
        };
    }
}
