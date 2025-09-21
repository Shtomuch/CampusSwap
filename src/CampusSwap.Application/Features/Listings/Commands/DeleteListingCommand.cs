using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Commands;

public class DeleteListingCommand : IRequest<bool>
{
    public Guid Id { get; set; }
}

public class DeleteListingCommandValidator : AbstractValidator<DeleteListingCommand>
{
    public DeleteListingCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Listing ID is required");
    }
}

public class DeleteListingCommandHandler : IRequestHandler<DeleteListingCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteListingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteListingCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var listing = await _context.Listings
            .FirstOrDefaultAsync(l => l.Id == request.Id && !l.IsDeleted, cancellationToken);

        if (listing == null)
            throw new InvalidOperationException("Listing not found");

        // Authorization check - only the owner can delete their listing
        if (listing.UserId != currentUserId)
            throw new UnauthorizedAccessException("You can only delete your own listings");

        // Check if listing has any active orders that would prevent deletion
        var hasActiveOrders = await _context.Orders
            .AnyAsync(o => o.ListingId == request.Id && o.Status != OrderStatus.Cancelled, cancellationToken);

        if (hasActiveOrders)
            throw new InvalidOperationException("Cannot delete listing with active orders");

        // Soft delete the listing
        listing.IsDeleted = true;
        listing.Status = ListingStatus.Cancelled;
        listing.UpdatedBy = _currentUserService.UserId;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}