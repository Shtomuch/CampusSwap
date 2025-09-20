using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class Conversation : BaseEntity
{
    public Guid User1Id { get; set; }
    public virtual User User1 { get; set; } = null!;
    
    public Guid User2Id { get; set; }
    public virtual User User2 { get; set; } = null!;
    
    public DateTime LastMessageAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}