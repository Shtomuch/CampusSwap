using AutoMapper;
using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Queries;

public class GetSavedListingsQuery : IRequest<List<SavedListingDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public ListingCategory? Category { get; set; }
    public string? SearchTerm { get; set; }
}

public class SavedListingDto
{
    public Guid Id { get; set; }
    public DateTime SavedAt { get; set; }
    public ListingDto Listing { get; set; } = null!;
}

public class GetSavedListingsQueryHandler : IRequestHandler<GetSavedListingsQuery, List<SavedListingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public GetSavedListingsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<List<SavedListingDto>> Handle(GetSavedListingsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var query = _context.SavedListings
            .Include(sl => sl.Listing)
                .ThenInclude(l => l.User)
            .Include(sl => sl.Listing)
                .ThenInclude(l => l.Images)
            .Where(sl => sl.UserId == currentUserId && !sl.Listing.IsDeleted && sl.Listing.Status == ListingStatus.Active);

        // Apply filters
        if (request.Category.HasValue)
            query = query.Where(sl => sl.Listing.Category == request.Category.Value);

        if (!string.IsNullOrEmpty(request.SearchTerm))
            query = query.Where(sl => sl.Listing.Title.Contains(request.SearchTerm) ||
                                    sl.Listing.Description.Contains(request.SearchTerm));

        var savedListings = await query
            .OrderByDescending(sl => sl.SavedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return savedListings.Select(sl => new SavedListingDto
        {
            Id = sl.Id,
            SavedAt = sl.SavedAt,
            Listing = _mapper.Map<ListingDto>(sl.Listing)
        }).ToList();
    }
}