using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class Review : BaseEntity
{
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public bool IsFromBuyer { get; set; }
    
    public Guid ReviewerId { get; set; }
    public virtual User Reviewer { get; set; } = null!;
    
    public Guid ReviewedUserId { get; set; }
    public virtual User ReviewedUser { get; set; } = null!;
    
    public Guid OrderId { get; set; }
    public virtual Order Order { get; set; } = null!;
}