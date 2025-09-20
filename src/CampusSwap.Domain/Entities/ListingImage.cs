using CampusSwap.Domain.Common;

namespace CampusSwap.Domain.Entities;

public class ListingImage : BaseEntity
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
    
    public Guid ListingId { get; set; }
    public virtual Listing Listing { get; set; } = null!;
}