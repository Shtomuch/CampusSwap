using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Notifications.Queries;

public class GetNotificationsQuery : IRequest<List<NotificationDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsRead { get; set; }
    public string? Type { get; set; }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }
    public string? Data { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Related entity IDs
    public Guid? OrderId { get; set; }
    public Guid? ConversationId { get; set; }
    public Guid? ListingId { get; set; }
}

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetNotificationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var query = _context.Notifications
            .Where(n => n.UserId == currentUserId)
            .AsQueryable();

        // Filter by read status
        if (request.IsRead.HasValue)
            query = query.Where(n => n.IsRead == request.IsRead.Value);

        // Filter by type
        if (!string.IsNullOrEmpty(request.Type))
            query = query.Where(n => n.Type == request.Type);

        // Order by creation date descending
        query = query.OrderByDescending(n => n.CreatedAt);

        // Apply pagination
        var notifications = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                ActionUrl = n.ActionUrl,
                Data = n.Data,
                CreatedAt = n.CreatedAt,
                OrderId = n.OrderId,
                ConversationId = n.ConversationId,
                ListingId = n.ListingId
            })
            .ToListAsync(cancellationToken);

        return notifications;
    }
}
