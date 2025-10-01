using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.SavedListings.Commands;

public class RemoveSavedListingCommand : IRequest<bool>
{
    public Guid ListingId { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class RemoveSavedListingCommandHandler : IRequestHandler<RemoveSavedListingCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public RemoveSavedListingCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RemoveSavedListingCommand request, CancellationToken cancellationToken)
    {
        try
        {
            Console.WriteLine($"[RemoveSavedListingCommand] Видалення збереженого оголошення: {request.ListingId} для користувача {request.UserId}");

            // Правильне перетворення UserId зі string у Guid
            if (!Guid.TryParse(request.UserId, out var userGuid))
            {
                Console.WriteLine($"[RemoveSavedListingCommand] ❌ Некоректний формат ID користувача: {request.UserId}");
                throw new ArgumentException($"Invalid user ID format: {request.UserId}");
            }

            Console.WriteLine($"[RemoveSavedListingCommand] 🔍 Пошук збереженого оголошення {request.ListingId} для UserID (Guid): {userGuid}");

            var savedListing = await _context.SavedListings
                .FirstOrDefaultAsync(sl => sl.ListingId == request.ListingId && sl.UserId == userGuid, cancellationToken);

            if (savedListing == null)
            {
                Console.WriteLine($"[RemoveSavedListingCommand] ⚠️ Оголошення {request.ListingId} не знайдено в збережених для користувача {userGuid}");
                return false;
            }

            Console.WriteLine($"[RemoveSavedListingCommand] 🗑️ Видалення запису з бази даних...");
            _context.SavedListings.Remove(savedListing);
            var deletedCount = await _context.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"[RemoveSavedListingCommand] 📊 SaveChangesAsync повернув: {deletedCount} записів видалено");

            Console.WriteLine($"[RemoveSavedListingCommand] ✅ Оголошення {request.ListingId} видалено з збережених для користувача {userGuid}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RemoveSavedListingCommand] ❌ Помилка: {ex.Message}");
            Console.WriteLine($"[RemoveSavedListingCommand] ❌ StackTrace: {ex.StackTrace}");
            throw;
        }
    }
}