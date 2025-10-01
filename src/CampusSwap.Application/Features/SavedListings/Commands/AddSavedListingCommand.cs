using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.SavedListings.Commands;

public class AddSavedListingCommand : IRequest<bool>
{
    public Guid ListingId { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class AddSavedListingCommandHandler : IRequestHandler<AddSavedListingCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AddSavedListingCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AddSavedListingCommand request, CancellationToken cancellationToken)
    {
        Console.WriteLine($"[AddSavedListingCommand] Додавання збереженого оголошення: {request.ListingId} для користувача {request.UserId}");

        // Перевіряємо чи вже існує
        var existing = await _context.SavedListings
            .FirstOrDefaultAsync(sl => sl.ListingId == request.ListingId && sl.UserId.ToString() == request.UserId, cancellationToken);

        if (existing != null)
        {
            Console.WriteLine($"[AddSavedListingCommand] Оголошення {request.ListingId} вже збережено");
            return true;
        }

        // Створюємо нове збережене оголошення
        var savedListing = new Domain.Entities.SavedListing
        {
            Id = Guid.NewGuid(),
            ListingId = request.ListingId,
            UserId = Guid.Parse(request.UserId),
            CreatedAt = DateTime.UtcNow
        };

        _context.SavedListings.Add(savedListing);
        await _context.SaveChangesAsync(cancellationToken);

        Console.WriteLine($"[AddSavedListingCommand] ✅ Оголошення {request.ListingId} додано до збережених");
        return true;
    }
}
