using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class User : BaseEntity, IAuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Faculty { get; set; } = string.Empty;
    public int YearOfStudy { get; set; }
    public string? ProfileImageUrl { get; set; }
    public double Rating { get; set; }
    public int ReviewsCount { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsPhoneVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // Navigation properties
    public virtual ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public virtual ICollection<Order> BuyerOrders { get; set; } = new List<Order>();
    public virtual ICollection<Order> SellerOrders { get; set; } = new List<Order>();
    public virtual ICollection<Review> ReviewsGiven { get; set; } = new List<Review>();
    public virtual ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
    public virtual ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ChatMessage> ReceivedMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<SavedListing> SavedListings { get; set; } = new List<SavedListing>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public string FullName => $"{FirstName} {LastName}";
}