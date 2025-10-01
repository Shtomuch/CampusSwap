using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Notifications.Commands;

public class MarkNotificationAsReadCommand : IRequest
{
    public Guid NotificationId { get; set; }
}

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkNotificationAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == currentUserId, cancellationToken);

        if (notification == null)
            throw new InvalidOperationException("Notification not found");

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;
        notification.UpdatedBy = currentUserId.ToString();

        await _context.SaveChangesAsync(cancellationToken);
    }
}
