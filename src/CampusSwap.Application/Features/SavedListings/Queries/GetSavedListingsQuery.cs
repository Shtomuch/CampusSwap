using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Application.Features.Listings.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.SavedListings.Queries;

public class GetSavedListingsQuery : IRequest<List<ListingDto>>
{
    public string UserId { get; set; } = string.Empty;
}

public class GetSavedListingsQueryHandler : IRequestHandler<GetSavedListingsQuery, List<ListingDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSavedListingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ListingDto>> Handle(GetSavedListingsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            Console.WriteLine($"[GetSavedListingsQuery] Отримання збережених оголошень для користувача {request.UserId}");

            // Правильне перетворення UserId зі string у Guid
            if (!Guid.TryParse(request.UserId, out var userGuid))
            {
                Console.WriteLine($"[GetSavedListingsQuery] ❌ Некоректний формат ID користувача: {request.UserId}");
                throw new ArgumentException($"Invalid user ID format: {request.UserId}");
            }

            Console.WriteLine($"[GetSavedListingsQuery] 🔍 Пошук збережених оголошень для UserID (Guid): {userGuid}");

            var savedListings = await _context.SavedListings
                .Where(sl => sl.UserId == userGuid && !sl.IsDeleted)
                .Include(sl => sl.Listing)
                    .ThenInclude(l => l.Images)
                .Include(sl => sl.Listing)
                    .ThenInclude(l => l.User)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

        var listings = savedListings.Select(sl => new ListingDto
        {
            Id = sl.Listing.Id,
            Title = sl.Listing.Title,
            Description = sl.Listing.Description,
            Price = sl.Listing.Price.Amount,
            Currency = sl.Listing.Price.Currency,
            Category = sl.Listing.Category,
            Status = sl.Listing.Status,
            Condition = sl.Listing.Condition,
            ISBN = sl.Listing.ISBN,
            CourseCode = sl.Listing.CourseCode,
            Location = sl.Listing.Location,
            IsNegotiable = sl.Listing.IsNegotiable,
            ViewsCount = sl.Listing.ViewsCount,
            UserId = sl.Listing.UserId,
            SellerName = sl.Listing.User?.FullName ?? "Невідомий продавець",
            CreatedAt = sl.Listing.CreatedAt,
            UpdatedAt = sl.Listing.UpdatedAt,
            ImageUrls = sl.Listing.Images?.Where(img => !img.IsDeleted).Select(img => img.ImageUrl).ToList() ?? new List<string>()
        }).ToList();

            Console.WriteLine($"[GetSavedListingsQuery] ✅ Знайдено {listings.Count} збережених оголошень");
            return listings;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GetSavedListingsQuery] ❌ Помилка: {ex.Message}");
            Console.WriteLine($"[GetSavedListingsQuery] ❌ StackTrace: {ex.StackTrace}");
            throw;
        }
    }
}

