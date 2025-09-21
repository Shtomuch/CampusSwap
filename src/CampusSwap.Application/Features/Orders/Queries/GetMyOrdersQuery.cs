using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Queries;

public class GetMyOrdersQuery : IRequest<List<OrderDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Status { get; set; }
    public bool IsBuyer { get; set; } = true;
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public string MeetingLocation { get; set; } = string.Empty;
    public DateTime MeetingTime { get; set; }
    public string? Notes { get; set; }

    // Listing info
    public Guid ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public string ListingImageUrl { get; set; } = string.Empty;

    // User info
    public Guid BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerEmail { get; set; } = string.Empty;

    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;

    // Reviews
    public bool HasBuyerReview { get; set; }
    public bool HasSellerReview { get; set; }
}

public class GetMyOrdersQueryHandler : IRequestHandler<GetMyOrdersQuery, List<OrderDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyOrdersQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<OrderDto>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var query = _context.Orders
            .Include(o => o.Listing)
                .ThenInclude(l => l.Images)
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .Include(o => o.BuyerReview)
            .Include(o => o.SellerReview)
            .AsQueryable();

        // Filter by user role
        if (request.IsBuyer)
            query = query.Where(o => o.BuyerId == currentUserId);
        else
            query = query.Where(o => o.SellerId == currentUserId);

        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<OrderStatus>(request.Status, out var status))
                query = query.Where(o => o.Status == status);
        }

        // Order by creation date descending
        query = query.OrderByDescending(o => o.CreatedAt);

        // Apply pagination
        var orders = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
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
                ListingImageUrl = o.Listing.Images.Any() ? o.Listing.Images.First().ImageUrl : "",

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
            .ToListAsync(cancellationToken);

        return orders;
    }
}