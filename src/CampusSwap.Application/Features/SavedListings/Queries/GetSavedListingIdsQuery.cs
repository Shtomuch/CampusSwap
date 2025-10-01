using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.SavedListings.Queries;

public class GetSavedListingIdsQuery : IRequest<List<Guid>>
{
    public string UserId { get; set; } = string.Empty;
}

public class GetSavedListingIdsQueryHandler : IRequestHandler<GetSavedListingIdsQuery, List<Guid>>
{
    private readonly IApplicationDbContext _context;

    public GetSavedListingIdsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Guid>> Handle(GetSavedListingIdsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            Console.WriteLine($"[GetSavedListingIdsQuery] Отримання ID збережених оголошень для користувача {request.UserId}");

            // Правильне перетворення UserId зі string у Guid
            if (!Guid.TryParse(request.UserId, out var userGuid))
            {
                Console.WriteLine($"[GetSavedListingIdsQuery] ❌ Некоректний формат ID користувача: {request.UserId}");
                throw new ArgumentException($"Invalid user ID format: {request.UserId}");
            }

            Console.WriteLine($"[GetSavedListingIdsQuery] 🔍 Пошук збережених оголошень для UserID (Guid): {userGuid}");

            // Спочатку перевіримо, чи є взагалі записи в таблиці SavedListings
            var totalSavedListings = await _context.SavedListings.CountAsync(cancellationToken);
            Console.WriteLine($"[GetSavedListingIdsQuery] 📊 Загальна кількість записів у SavedListings: {totalSavedListings}");

            if (totalSavedListings > 0)
            {
                // Виведемо кілька прикладів записів для діагностики
                var sampleRecords = await _context.SavedListings
                    .Take(3)
                    .Select(sl => new { sl.UserId, sl.ListingId, sl.SavedAt })
                    .ToListAsync(cancellationToken);

                Console.WriteLine($"[GetSavedListingIdsQuery] 🔍 Приклади записів у базі:");
                foreach (var record in sampleRecords)
                {
                    Console.WriteLine($"[GetSavedListingIdsQuery]   UserId: {record.UserId}, ListingId: {record.ListingId}, SavedAt: {record.SavedAt}");
                }
            }

            // Правильний запит з використанням Guid порівняння
            var savedListingIds = await _context.SavedListings
                .Where(sl => sl.UserId == userGuid)
                .Select(sl => sl.ListingId)
                .ToListAsync(cancellationToken);

            Console.WriteLine($"[GetSavedListingIdsQuery] ✅ Знайдено {savedListingIds.Count} ID збережених оголошень для користувача {userGuid}");

            if (savedListingIds.Count > 0)
            {
                Console.WriteLine($"[GetSavedListingIdsQuery] 📋 ID знайдених оголошень: {string.Join(", ", savedListingIds)}");
            }

            return savedListingIds;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GetSavedListingIdsQuery] ❌ Помилка: {ex.Message}");
            Console.WriteLine($"[GetSavedListingIdsQuery] ❌ StackTrace: {ex.StackTrace}");
            throw;
        }
    }
}
