using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class CompleteOrderCommand : IRequest<bool>
{
    public Guid OrderId { get; set; }
}

public class CompleteOrderCommandHandler : IRequestHandler<CompleteOrderCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CompleteOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(CompleteOrderCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var order = await _context.Orders
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new InvalidOperationException("Order not found");

        // Either buyer or seller can mark order as completed
        if (order.BuyerId != currentUserId && order.SellerId != currentUserId)
            throw new UnauthorizedAccessException("You can only complete your own orders");

        // Order must be in Confirmed status to be completed
        if (order.Status != OrderStatus.Confirmed)
            throw new InvalidOperationException("Order can only be completed when in Confirmed status");

        // Update order status
        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;
        order.UpdatedBy = _currentUserService.Email;

        // Mark the listing as sold if this was the last item
        if (order.Listing.Status == ListingStatus.Active)
        {
            // Check if there are any other pending/confirmed orders for this listing
            var hasPendingOrders = await _context.Orders
                .AnyAsync(o => o.ListingId == order.ListingId &&
                              o.Id != order.Id &&
                              (o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed),
                          cancellationToken);

            if (!hasPendingOrders)
            {
                order.Listing.Status = ListingStatus.Sold;
                order.Listing.UpdatedBy = _currentUserService.Email;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}