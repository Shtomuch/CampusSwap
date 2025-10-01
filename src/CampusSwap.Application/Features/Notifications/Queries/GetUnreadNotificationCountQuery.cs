using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Notifications.Queries;

public class GetUnreadNotificationCountQuery : IRequest<UnreadCountsDto>
{
}

public class UnreadCountsDto
{
    public int UnreadNotificationCount { get; set; }
    public int UnreadChatCount { get; set; }
}

public class GetUnreadNotificationCountQueryHandler : IRequestHandler<GetUnreadNotificationCountQuery, UnreadCountsDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUnreadNotificationCountQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UnreadCountsDto> Handle(GetUnreadNotificationCountQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // Count unread notifications
        var unreadNotificationCount = await _context.Notifications
            .Where(n => n.UserId == currentUserId && !n.IsRead)
            .CountAsync(cancellationToken);

        // Count unread chat messages
        var unreadChatCount = await _context.ChatMessages
            .Where(m => m.ReceiverId == currentUserId && !m.IsRead)
            .CountAsync(cancellationToken);

        return new UnreadCountsDto
        {
            UnreadNotificationCount = unreadNotificationCount,
            UnreadChatCount = unreadChatCount
        };
    }
}
