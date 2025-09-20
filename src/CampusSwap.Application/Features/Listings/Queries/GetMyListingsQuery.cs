using CampusSwap.Application.Common.Interfaces;
using MediatR;

namespace CampusSwap.Application.Features.Listings.Queries;

public class GetMyListingsQuery : IRequest<List<ListingDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetMyListingsQueryHandler : IRequestHandler<GetMyListingsQuery, List<ListingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyListingsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<ListingDto>> Handle(GetMyListingsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // For now, return empty list as stub implementation
        return new List<ListingDto>();
    }
}