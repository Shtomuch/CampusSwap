using CampusSwap.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Commands;

public class UnsaveListingCommand : IRequest<bool>
{
    public Guid ListingId { get; set; }
}

public class UnsaveListingCommandValidator : AbstractValidator<UnsaveListingCommand>
{
    public UnsaveListingCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");
    }
}

public class UnsaveListingCommandHandler : IRequestHandler<UnsaveListingCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UnsaveListingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UnsaveListingCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // Find the saved listing
        var savedListing = await _context.SavedListings
            .FirstOrDefaultAsync(sl => sl.UserId == currentUserId && sl.ListingId == request.ListingId,
                cancellationToken);

        if (savedListing == null)
            return true; // Not saved anyway, no action needed

        // Remove the saved listing
        _context.SavedListings.Remove(savedListing);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}