using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class ConfirmOrderCommand : IRequest<bool>
{
    public Guid OrderId { get; set; }
}

public class ConfirmOrderCommandValidator : AbstractValidator<ConfirmOrderCommand>
{
    public ConfirmOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");
    }
}

public class ConfirmOrderCommandHandler : IRequestHandler<ConfirmOrderCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public ConfirmOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(ConfirmOrderCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        // Only seller can confirm the order
        if (order.SellerId != currentUserId)
            throw new UnauthorizedAccessException("Only the seller can confirm the order");

        // Order must be in Pending status to be confirmed
        if (order.Status != OrderStatus.Pending)
            throw new InvalidOperationException("Order can only be confirmed when in Pending status");

        // Update order status
        order.Status = OrderStatus.Confirmed;
        order.ConfirmedAt = DateTime.UtcNow;
        order.UpdatedBy = _currentUserService.Email;

        await _context.SaveChangesAsync(cancellationToken);

        // Create notification for the buyer
        await _notificationService.CreateNotificationAsync(
            order.BuyerId,
            "order",
            "Замовлення підтверджено",
            $"Ваше замовлення \"{order.Listing.Title}\" підтверджено продавцем",
            $"/orders/{order.Id}",
            null,
            order.Id,
            null,
            order.ListingId);

        return true;
    }
}