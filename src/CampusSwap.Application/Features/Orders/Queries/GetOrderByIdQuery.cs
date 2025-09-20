using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Queries;

public class GetOrderByIdQuery : IRequest<OrderDto?>
{
    public Guid Id { get; set; }
}

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetOrderByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<OrderDto?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var order = await _context.Orders
            .Include(o => o.Listing)
                .ThenInclude(l => l.Images)
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .Include(o => o.BuyerReview)
            .Include(o => o.SellerReview)
            .Where(o => o.Id == request.Id)
            .Where(o => o.BuyerId == currentUserId || o.SellerId == currentUserId)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Status = o.Status,
                TotalAmount = o.TotalAmount.Amount,
                Currency = o.TotalAmount.Currency,
                CreatedAt = o.CreatedAt,
                ConfirmedAt = o.ConfirmedAt,
                CompletedAt = o.CompletedAt,
                CancelledAt = o.CancelledAt,
                CancellationReason = o.CancellationReason,
                MeetingLocation = o.MeetingLocation,
                MeetingTime = o.MeetingTime,
                Notes = o.Notes,

                // Listing info
                ListingId = o.ListingId,
                ListingTitle = o.Listing.Title,
                ListingImageUrl = o.Listing.Images.Any() ? o.Listing.Images.First().Url : "",

                // User info
                BuyerId = o.BuyerId,
                BuyerName = o.Buyer.FullName,
                BuyerEmail = o.Buyer.Email,

                SellerId = o.SellerId,
                SellerName = o.Seller.FullName,
                SellerEmail = o.Seller.Email,

                // Reviews
                HasBuyerReview = o.BuyerReview != null,
                HasSellerReview = o.SellerReview != null
            })
            .FirstOrDefaultAsync(cancellationToken);

        return order;
    }
}