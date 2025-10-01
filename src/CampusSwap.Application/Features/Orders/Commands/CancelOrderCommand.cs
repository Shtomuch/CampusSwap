using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class CancelOrderCommand : IRequest
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class CancelOrderCommandValidator : AbstractValidator<CancelOrderCommand>
{
    public CancelOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");
    }
}

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public CancelOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new InvalidOperationException("Order not found");

        if (!Guid.TryParse(_currentUserService.UserId, out var userId))
            throw new InvalidOperationException("Invalid user ID");

        if (order.BuyerId != userId)
            throw new UnauthorizedAccessException("You can only cancel your own orders");

        if (order.Status != OrderStatus.Pending)
            throw new InvalidOperationException("Only pending orders can be cancelled");

        order.Status = OrderStatus.Cancelled;
        order.CancelledAt = DateTime.UtcNow;
        order.CancellationReason = request.Reason;

        await _context.SaveChangesAsync(cancellationToken);

        // Create notification for the other party
        var otherUserId = order.BuyerId == userId ? order.Listing.UserId : order.BuyerId;
        var otherUserName = order.BuyerId == userId ? order.Listing.User.FullName : order.Buyer.FullName;
        
        await _notificationService.CreateNotificationAsync(
            otherUserId,
            "order",
            "Замовлення скасовано",
            $"Замовлення \"{order.Listing.Title}\" скасовано користувачем {otherUserName}",
            $"/orders/{order.Id}",
            null,
            order.Id,
            null,
            order.ListingId);
    }
}