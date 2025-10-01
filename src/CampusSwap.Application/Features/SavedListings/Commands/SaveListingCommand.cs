using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.SavedListings.Commands;

public class SaveListingCommand : IRequest
{
    public string UserId { get; set; } = string.Empty;
    public string ListingId { get; set; } = string.Empty;
}

public class SaveListingCommandHandler : IRequestHandler<SaveListingCommand>
{
    private readonly IApplicationDbContext _context;

    public SaveListingCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(SaveListingCommand request, CancellationToken cancellationToken)
    {
        Console.WriteLine($"[SaveListingCommand] Збереження оголошення {request.ListingId} для користувача {request.UserId}");

        // Перевіряємо, чи вже збережено
        if (!Guid.TryParse(request.UserId, out var userGuid))
        {
            Console.WriteLine($"[SaveListingCommand] ❌ Некоректний формат ID користувача: {request.UserId}");
            throw new ArgumentException($"Invalid user ID format: {request.UserId}");
        }

        if (!Guid.TryParse(request.ListingId, out var listingGuid))
        {
            Console.WriteLine($"[SaveListingCommand] ❌ Некоректний формат ID оголошення: {request.ListingId}");
            throw new ArgumentException($"Invalid listing ID format: {request.ListingId}");
        }

        var existing = await _context.SavedListings
            .FirstOrDefaultAsync(sl => sl.UserId == userGuid &&
                                     sl.ListingId == listingGuid,
                                cancellationToken);

        if (existing != null)
        {
            Console.WriteLine($"[SaveListingCommand] ⚠️ Оголошення вже збережено");
            return; // Вже збережено
        }


        // Перевіряємо, чи існує оголошення
        var listing = await _context.Listings
            .FirstOrDefaultAsync(l => l.Id == listingGuid, cancellationToken);

        if (listing == null)
        {
            Console.WriteLine($"[SaveListingCommand] ❌ Оголошення {request.ListingId} не знайдено");
            throw new KeyNotFoundException($"Listing with ID {request.ListingId} not found.");
        }

        // Створюємо нове збереження
        var savedListing = new CampusSwap.Domain.Entities.SavedListing
        {
            Id = Guid.NewGuid(),
            UserId = userGuid,
            ListingId = listingGuid,
            SavedAt = DateTime.UtcNow
        };

        Console.WriteLine($"[SaveListingCommand] 📝 Додавання запису до контексту...");
        _context.SavedListings.Add(savedListing);

        Console.WriteLine($"[SaveListingCommand] 💾 Виклик SaveChangesAsync...");
        var savedCount = await _context.SaveChangesAsync(cancellationToken);
        Console.WriteLine($"[SaveListingCommand] 📊 SaveChangesAsync повернув: {savedCount} записів збережено");

        Console.WriteLine($"[SaveListingCommand] ✅ Оголошення {request.ListingId} успішно збережено");
    }
}
