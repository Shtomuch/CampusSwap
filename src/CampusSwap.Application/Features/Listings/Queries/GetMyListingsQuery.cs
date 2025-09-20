using AutoMapper;
using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Queries;

public class GetMyListingsQuery : IRequest<List<ListingDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public ListingStatus? Status { get; set; }
    public ListingCategory? Category { get; set; }
    public string? SearchTerm { get; set; }
}

public class GetMyListingsQueryHandler : IRequestHandler<GetMyListingsQuery, List<ListingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public GetMyListingsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<List<ListingDto>> Handle(GetMyListingsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var query = _context.Listings
            .Include(l => l.User)
            .Include(l => l.Images)
            .Where(l => l.UserId == currentUserId && !l.IsDeleted);

        // Apply filters
        if (request.Status.HasValue)
            query = query.Where(l => l.Status == request.Status.Value);

        if (request.Category.HasValue)
            query = query.Where(l => l.Category == request.Category.Value);

        if (!string.IsNullOrEmpty(request.SearchTerm))
            query = query.Where(l => l.Title.Contains(request.SearchTerm) ||
                                   l.Description.Contains(request.SearchTerm));

        var listings = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ListingDto>>(listings);
    }
}