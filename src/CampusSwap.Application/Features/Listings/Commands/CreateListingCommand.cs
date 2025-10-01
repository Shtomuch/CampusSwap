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
            .NotEmpty().WithMessage("Назва обов'язкова")
            .MaximumLength(200).WithMessage("Назва не може перевищувати 200 символів");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Опис обов'язковий")
            .MaximumLength(2000).WithMessage("Опис не може перевищувати 2000 символів");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Ціна має бути більше 0");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Місце зустрічі обов'язкове")
            .MaximumLength(200).WithMessage("Місце зустрічі не може перевищувати 200 символів");

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Невірна категорія");

        RuleFor(x => x.Condition)
            .NotEmpty().WithMessage("Стан обов'язковий")
            .MaximumLength(50).WithMessage("Стан не може перевищувати 50 символів");

        RuleFor(x => x.ImageUrls)
            .Must(x => x != null && x.Count > 0).WithMessage("Необхідно додати хоча б одне зображення")
            .Must(x => x == null || x.Count <= 10).WithMessage("Максимум 10 зображень");

        RuleFor(x => x.ISBN)
            .MaximumLength(20).WithMessage("ISBN не може перевищувати 20 символів")
            .When(x => !string.IsNullOrEmpty(x.ISBN));

        RuleFor(x => x.Author)
            .MaximumLength(100).WithMessage("Ім'я автора не може перевищувати 100 символів")
            .When(x => !string.IsNullOrEmpty(x.Author));

        RuleFor(x => x.CourseCode)
            .MaximumLength(20).WithMessage("Код курсу не може перевищувати 20 символів")
            .When(x => !string.IsNullOrEmpty(x.CourseCode));

        RuleFor(x => x.PublicationYear)
            .InclusiveBetween(1900, DateTime.Now.Year).WithMessage($"Рік видання має бути від 1900 до {DateTime.Now.Year}")
            .When(x => x.PublicationYear.HasValue);
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