using CampusSwap.Application.Common.Interfaces;
using MediatR;

namespace CampusSwap.Application.Features.Listings.Commands;

public class UnsaveListingCommand : IRequest<bool>
{
    public Guid ListingId { get; set; }
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

        // For now, return true as stub implementation
        return true;
    }
}