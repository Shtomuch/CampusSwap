using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using MediatR;

namespace CampusSwap.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public NotificationService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task CreateNotificationAsync(
        Guid userId,
        string type,
        string title,
        string message,
        string? actionUrl = null,
        string? data = null,
        Guid? orderId = null,
        Guid? conversationId = null,
        Guid? listingId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            ActionUrl = actionUrl,
            Data = data,
            OrderId = orderId,
            ConversationId = conversationId,
            ListingId = listingId,
            IsRead = false,
            CreatedBy = _currentUserService.UserId,
            UpdatedBy = _currentUserService.UserId
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task CreateOrderNotificationAsync(
        Guid userId,
        string title,
        string message,
        Guid orderId,
        string? actionUrl = null,
        CancellationToken cancellationToken = default)
    {
        await CreateNotificationAsync(
            userId,
            "order",
            title,
            message,
            actionUrl ?? "/orders",
            null,
            orderId,
            null,
            null,
            cancellationToken);
    }

    public async Task CreateMessageNotificationAsync(
        Guid userId,
        string title,
        string message,
        Guid conversationId,
        string? actionUrl = null,
        CancellationToken cancellationToken = default)
    {
        await CreateNotificationAsync(
            userId,
            "message",
            title,
            message,
            actionUrl ?? "/chat",
            null,
            null,
            conversationId,
            null,
            cancellationToken);
    }

    public async Task CreateSystemNotificationAsync(
        Guid userId,
        string title,
        string message,
        string? actionUrl = null,
        CancellationToken cancellationToken = default)
    {
        await CreateNotificationAsync(
            userId,
            "system",
            title,
            message,
            actionUrl,
            null,
            null,
            null,
            null,
            cancellationToken);
    }
}
