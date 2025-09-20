using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Application.Features.Chat.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Chat.Queries;

public class GetConversationMessagesQuery : IRequest<List<MessageDto>>
{
    public Guid OtherUserId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetConversationMessagesQueryHandler : IRequestHandler<GetConversationMessagesQuery, List<MessageDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetConversationMessagesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<MessageDto>> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var messages = await _context.ChatMessages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m =>
                (m.SenderId == currentUserId && m.ReceiverId == request.OtherUserId) ||
                (m.SenderId == request.OtherUserId && m.ReceiverId == currentUserId))
            .OrderByDescending(m => m.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                ReceiverId = m.ReceiverId,
                ReceiverName = m.Receiver.FullName,
                Content = m.Content,
                SentAt = m.CreatedAt,
                IsRead = m.IsRead
            })
            .ToListAsync(cancellationToken);

        messages.Reverse();

        // Mark messages as read
        var unreadMessageIds = messages
            .Where(m => m.ReceiverId == currentUserId && !m.IsRead)
            .Select(m => m.Id)
            .ToList();

        if (unreadMessageIds.Any())
        {
            var messagesToUpdate = await _context.ChatMessages
                .Where(m => unreadMessageIds.Contains(m.Id))
                .ToListAsync(cancellationToken);

            foreach (var msg in messagesToUpdate)
            {
                msg.IsRead = true;
                msg.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return messages;
    }
}