namespace CampusSwap.Application.Features.Reviews.Queries;

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string ReviewerImageUrl { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}