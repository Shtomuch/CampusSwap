using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class CreateOrderCommand : IRequest<Guid>
{
    public Guid ListingId { get; set; }
    public string MeetingLocation { get; set; } = string.Empty;
    public DateTime MeetingTime { get; set; }
    public string? Notes { get; set; }
}

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var listing = await _context.Listings
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId, cancellationToken)
            ?? throw new InvalidOperationException("Listing not found");

        if (listing.Status != ListingStatus.Active)
            throw new InvalidOperationException("Listing is not active");

        if (!Guid.TryParse(_currentUserService.UserId, out var buyerId))
            throw new InvalidOperationException("Invalid user ID");

        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            ListingId = request.ListingId,
            BuyerId = buyerId,
            SellerId = listing.UserId,
            TotalAmount = listing.Price,
            Status = OrderStatus.Pending,
            MeetingLocation = request.MeetingLocation,
            MeetingTime = request.MeetingTime,
            Notes = request.Notes
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return order.Id;
    }
}