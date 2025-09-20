using CampusSwap.Domain.Common;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;

namespace CampusSwap.Domain.Entities;

public class Order : BaseEntity, IAuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public Money TotalAmount { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public string MeetingLocation { get; set; } = string.Empty;
    public DateTime MeetingTime { get; set; }
    
    public Guid BuyerId { get; set; }
    public virtual User Buyer { get; set; } = null!;
    
    public Guid SellerId { get; set; }
    public virtual User Seller { get; set; } = null!;
    
    public Guid ListingId { get; set; }
    public virtual Listing Listing { get; set; } = null!;
    
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // Navigation properties
    public virtual Review? BuyerReview { get; set; }
    public virtual Review? SellerReview { get; set; }
}