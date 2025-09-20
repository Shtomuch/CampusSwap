using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;
using FluentValidation;
using MediatR;

namespace CampusSwap.Application.Features.Listings.Commands;

public class CreateListingCommand : IRequest<Guid>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public ListingCategory Category { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string? CourseCode { get; set; }
    public string? Author { get; set; }
    public int? PublicationYear { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsNegotiable { get; set; }
    public List<string> ImageUrls { get; set; } = new();
}

public class CreateListingCommandValidator : AbstractValidator<CreateListingCommand>
{
    public CreateListingCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required")
            .MaximumLength(200).WithMessage("Location must not exceed 200 characters");

        RuleFor(x => x.ImageUrls)
            .Must(x => x.Count > 0).WithMessage("At least one image is required")
            .Must(x => x.Count <= 10).WithMessage("Maximum 10 images allowed");
    }
}

public class CreateListingCommandHandler : IRequestHandler<CreateListingCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateListingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(CreateListingCommand request, CancellationToken cancellationToken)
    {
        var listing = new Listing
        {
            Title = request.Title,
            Description = request.Description,
            Price = new Money(request.Price),
            Category = request.Category,
            Status = ListingStatus.Active,
            Condition = request.Condition,
            ISBN = request.ISBN,
            CourseCode = request.CourseCode,
            Author = request.Author,
            PublicationYear = request.PublicationYear,
            Location = request.Location,
            IsNegotiable = request.IsNegotiable,
            UserId = Guid.Parse(_currentUserService.UserId!),
            CreatedBy = _currentUserService.UserId,
            UpdatedBy = _currentUserService.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        for (int i = 0; i < request.ImageUrls.Count; i++)
        {
            listing.Images.Add(new ListingImage
            {
                ImageUrl = request.ImageUrls[i],
                IsPrimary = i == 0,
                DisplayOrder = i
            });
        }

        _context.Listings.Add(listing);
        await _context.SaveChangesAsync(cancellationToken);

        return listing.Id;
    }
}