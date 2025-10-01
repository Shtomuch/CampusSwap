using CampusSwap.Domain.Entities;

namespace CampusSwap.Application.Common.Interfaces;

public interface INotificationService
{
    Task CreateNotificationAsync(
        Guid userId,
        string type,
        string title,
        string message,
        string? actionUrl = null,
        string? data = null,
        Guid? orderId = null,
        Guid? conversationId = null,
        Guid? listingId = null,
        CancellationToken cancellationToken = default);

    Task CreateOrderNotificationAsync(
        Guid userId,
        string title,
        string message,
        Guid orderId,
        string? actionUrl = null,
        CancellationToken cancellationToken = default);

    Task CreateMessageNotificationAsync(
        Guid userId,
        string title,
        string message,
        Guid conversationId,
        string? actionUrl = null,
        CancellationToken cancellationToken = default);

    Task CreateSystemNotificationAsync(
        Guid userId,
        string title,
        string message,
        string? actionUrl = null,
        CancellationToken cancellationToken = default);
}
