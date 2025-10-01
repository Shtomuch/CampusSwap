using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class Notification : BaseEntity, IAuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Type { get; set; } = string.Empty; // 'order', 'message', 'system'
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public string? ActionUrl { get; set; }
    public string? Data { get; set; } // JSON data for additional info
    
    // Foreign keys for related entities
    public Guid? OrderId { get; set; }
    public Order? Order { get; set; }
    
    public Guid? ConversationId { get; set; }
    public Conversation? Conversation { get; set; }
    
    public Guid? ListingId { get; set; }
    public Listing? Listing { get; set; }

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
