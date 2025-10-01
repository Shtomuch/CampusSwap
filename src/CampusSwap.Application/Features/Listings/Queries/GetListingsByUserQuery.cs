using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Application.Features.Listings.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Queries;

public class GetListingsByUserQuery : IRequest<List<ListingDto>>
{
    public string UserId { get; set; } = string.Empty;
}

public class GetListingsByUserQueryHandler : IRequestHandler<GetListingsByUserQuery, List<ListingDto>>
{
    private readonly IApplicationDbContext _context;

    public GetListingsByUserQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ListingDto>> Handle(GetListingsByUserQuery request, CancellationToken cancellationToken)
    {
        Console.WriteLine($"[GetListingsByUserQuery] Отримання оголошень для користувача {request.UserId}");

        // Перевіряємо, чи можна парсити UserId як Guid
        if (!Guid.TryParse(request.UserId, out var userId))
        {
            Console.WriteLine($"[GetListingsByUserQuery] ❌ Невірний формат UserId: {request.UserId}");
            return new List<ListingDto>();
        }

        Console.WriteLine($"[GetListingsByUserQuery] 🔍 Шукаємо користувача з ID: {userId}");

        // Перевіряємо, чи існує користувач
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        
        if (user == null)
        {
            Console.WriteLine($"[GetListingsByUserQuery] ❌ Користувач {request.UserId} не знайдено");
            return new List<ListingDto>();
        }
        
        Console.WriteLine($"[GetListingsByUserQuery] ✅ Користувач знайдено: {user.Email}");

        // Перевіряємо всі оголошення в базі
        var allListings = await _context.Listings
            .Include(l => l.Images)
            .Include(l => l.User)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        
        Console.WriteLine($"[GetListingsByUserQuery] 📊 Загальна кількість оголошень в базі: {allListings.Count}");
        
        if (allListings.Any())
        {
            Console.WriteLine($"[GetListingsByUserQuery] 🔍 Приклади оголошень в базі:");
            foreach (var listing in allListings.Take(3))
            {
                Console.WriteLine($"[GetListingsByUserQuery]   ID: {listing.Id}, UserId: {listing.UserId}, Title: {listing.Title}, IsDeleted: {listing.IsDeleted}, Price: {listing.Price.Amount} {listing.Price.Currency}");
            }
        }

        // Використовуємо ToString().ToUpper() для порівняння, оскільки в базі даних Guid зберігається у верхньому регістрі
        var listings = await _context.Listings
            .Where(l => l.UserId.ToString().ToUpper() == request.UserId.ToUpper() && !l.IsDeleted)
            .Include(l => l.Images)
            .Include(l => l.User)
            .AsNoTracking()
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

        Console.WriteLine($"[GetListingsByUserQuery] 🔍 Знайдено {listings.Count} оголошень для користувача {userId}");

        var result = listings.Select(l => new ListingDto
        {
            Id = l.Id,
            Title = l.Title,
            Description = l.Description,
            Price = l.Price.Amount,
            Currency = l.Price.Currency,
            Category = l.Category,
            Status = l.Status,
            Condition = l.Condition,
            ISBN = l.ISBN,
            CourseCode = l.CourseCode,
            Location = l.Location,
            IsNegotiable = l.IsNegotiable,
            ViewsCount = l.ViewsCount,
            UserId = l.UserId,
            SellerName = l.User?.FullName ?? "Невідомий продавець",
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt,
            ImageUrls = l.Images?.Where(img => !img.IsDeleted).Select(img => img.ImageUrl).ToList() ?? new List<string>()
        }).ToList();

        Console.WriteLine($"[GetListingsByUserQuery] ✅ Знайдено {result.Count} оголошень для користувача");
        return result;
    }
}

