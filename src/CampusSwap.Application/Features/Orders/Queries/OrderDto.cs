using CampusSwap.Domain.Enums;

namespace CampusSwap.Application.Features.Orders.Queries;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "UAH";
    public string? Notes { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string MeetingLocation { get; set; } = string.Empty;
    public DateTime MeetingTime { get; set; }
    public Guid BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public Guid ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ReviewDto
{
    public Guid Id { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsFromBuyer { get; set; }
    public Guid ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}