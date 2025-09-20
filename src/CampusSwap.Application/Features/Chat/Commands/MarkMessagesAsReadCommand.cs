using CampusSwap.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Chat.Commands;

public class MarkMessagesAsReadCommand : IRequest<bool>
{
    public Guid ConversationId { get; set; }
}

public class MarkMessagesAsReadCommandValidator : AbstractValidator<MarkMessagesAsReadCommand>
{
    public MarkMessagesAsReadCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");
    }
}

public class MarkMessagesAsReadCommandHandler : IRequestHandler<MarkMessagesAsReadCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkMessagesAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(MarkMessagesAsReadCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // Verify conversation exists and user is part of it
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId &&
                                    (c.User1Id == currentUserId || c.User2Id == currentUserId),
                                cancellationToken);

        if (conversation == null)
            throw new InvalidOperationException("Conversation not found or you are not a participant");

        // Mark all unread messages in this conversation where current user is the receiver as read
        var unreadMessages = await _context.ChatMessages
            .Where(m => m.ConversationId == request.ConversationId &&
                       m.ReceiverId == currentUserId &&
                       !m.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadMessages.Any())
        {
            var readAt = DateTime.UtcNow;
            foreach (var message in unreadMessages)
            {
                message.IsRead = true;
                message.ReadAt = readAt;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}