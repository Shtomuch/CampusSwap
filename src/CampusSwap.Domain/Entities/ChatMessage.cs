using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class ChatMessage : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    
    public Guid SenderId { get; set; }
    public virtual User Sender { get; set; } = null!;
    
    public Guid ReceiverId { get; set; }
    public virtual User Receiver { get; set; } = null!;
    
    public Guid? ListingId { get; set; }
    public virtual Listing? Listing { get; set; }
    
    public Guid ConversationId { get; set; }
    public virtual Conversation Conversation { get; set; } = null!;
}