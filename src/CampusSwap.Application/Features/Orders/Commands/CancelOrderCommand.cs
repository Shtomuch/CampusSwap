using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class CancelOrderCommand : IRequest
{
    public Guid OrderId { get; set; }
}

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CancelOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
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
        order.CancellationReason = "Cancelled by buyer";

        await _context.SaveChangesAsync(cancellationToken);
    }
}