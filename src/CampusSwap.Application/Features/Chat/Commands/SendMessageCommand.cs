using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Chat.Commands;

public class SendMessageCommand : IRequest<MessageDto>
{
    public Guid ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public Guid ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
}

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SendMessageCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<MessageDto> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var senderId))
            throw new InvalidOperationException("Invalid user ID");

        var sender = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == senderId, cancellationToken)
            ?? throw new InvalidOperationException("Sender not found");

        var receiver = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.ReceiverId, cancellationToken)
            ?? throw new InvalidOperationException("Receiver not found");

        // Find or create conversation
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c =>
                (c.User1Id == senderId && c.User2Id == request.ReceiverId) ||
                (c.User1Id == request.ReceiverId && c.User2Id == senderId),
                cancellationToken);

        if (conversation == null)
        {
            conversation = new Conversation
            {
                User1Id = senderId,
                User2Id = request.ReceiverId
            };
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var message = new ChatMessage
        {
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            Content = request.Content,
            ConversationId = conversation.Id,
            IsRead = false
        };

        _context.ChatMessages.Add(message);
        conversation.LastMessageAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new MessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderName = sender.FullName,
            ReceiverId = message.ReceiverId,
            ReceiverName = receiver.FullName,
            Content = message.Content,
            SentAt = message.CreatedAt,
            IsRead = message.IsRead
        };
    }
}