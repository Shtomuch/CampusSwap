using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class ConfirmOrderCommand : IRequest<bool>
{
    public Guid OrderId { get; set; }
}

public class ConfirmOrderCommandHandler : IRequestHandler<ConfirmOrderCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ConfirmOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
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

        return true;
    }
}