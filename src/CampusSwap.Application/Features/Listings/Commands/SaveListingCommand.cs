using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Commands;

public class SaveListingCommand : IRequest<bool>
{
    public Guid ListingId { get; set; }
}

public class SaveListingCommandValidator : AbstractValidator<SaveListingCommand>
{
    public SaveListingCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");
    }
}

public class SaveListingCommandHandler : IRequestHandler<SaveListingCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SaveListingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(SaveListingCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // Check if listing exists and is active
        var listing = await _context.Listings
            .FirstOrDefaultAsync(l => l.Id == request.ListingId && !l.IsDeleted && l.Status == ListingStatus.Active,
                cancellationToken);

        if (listing == null)
            throw new InvalidOperationException("Listing not found or inactive");

        // Prevent users from saving their own listings
        if (listing.UserId == currentUserId)
            throw new InvalidOperationException("You cannot save your own listing");

        // Check if already saved
        var existingSavedListing = await _context.SavedListings
            .FirstOrDefaultAsync(sl => sl.UserId == currentUserId && sl.ListingId == request.ListingId,
                cancellationToken);

        if (existingSavedListing != null)
            return true; // Already saved, no action needed

        // Create new saved listing
        var savedListing = new SavedListing
        {
            UserId = currentUserId,
            ListingId = request.ListingId,
            SavedAt = DateTime.UtcNow
        };

        _context.SavedListings.Add(savedListing);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}