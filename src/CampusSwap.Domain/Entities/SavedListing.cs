using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class SavedListing : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    
    public Guid ListingId { get; set; }
    public virtual Listing Listing { get; set; } = null!;
    
    public DateTime SavedAt { get; set; }
}