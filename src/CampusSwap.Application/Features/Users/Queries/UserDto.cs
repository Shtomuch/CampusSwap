namespace CampusSwap.Application.Features.Users.Queries;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
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
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}