using CampusSwap.Domain.Common;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;

namespace CampusSwap.Domain.Entities;

public class Listing : BaseEntity, IAuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Money Price { get; set; } = null!;
    public ListingCategory Category { get; set; }
    public ListingStatus Status { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? ISBN { get; set; } // For textbooks
    public string? CourseCode { get; set; } // For study materials
    public string? Author { get; set; } // For textbooks
    public int? PublicationYear { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsNegotiable { get; set; }
    public int ViewsCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // Navigation properties
    public virtual ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<SavedListing> SavedByUsers { get; set; } = new List<SavedListing>();
    public virtual ICollection<ChatMessage> RelatedMessages { get; set; } = new List<ChatMessage>();
}