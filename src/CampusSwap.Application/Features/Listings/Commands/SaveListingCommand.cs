using CampusSwap.Application.Common.Interfaces;
using MediatR;

namespace CampusSwap.Application.Features.Listings.Commands;

public class SaveListingCommand : IRequest<bool>
{
    public Guid ListingId { get; set; }
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

        // For now, return true as stub implementation
        return true;
    }
}