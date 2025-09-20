using CampusSwap.Domain.Enums;

namespace CampusSwap.Application.Features.Listings.Queries;

public class ListingDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "UAH";
    public ListingCategory Category { get; set; }
    public ListingStatus Status { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string? CourseCode { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsNegotiable { get; set; }
    public int ViewsCount { get; set; }
    public Guid UserId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ListingImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsPrimary { get; set; }
}