using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Notifications.Commands;

public class MarkAllNotificationsAsReadCommand : IRequest
{
    public string? Type { get; set; }
}

public class MarkAllNotificationsAsReadCommandHandler : IRequestHandler<MarkAllNotificationsAsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkAllNotificationsAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(MarkAllNotificationsAsReadCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var query = _context.Notifications
            .Where(n => n.UserId == currentUserId && !n.IsRead);

        if (!string.IsNullOrEmpty(request.Type))
            query = query.Where(n => n.Type == request.Type);

        var notifications = await query.ToListAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            notification.UpdatedBy = currentUserId.ToString();
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
