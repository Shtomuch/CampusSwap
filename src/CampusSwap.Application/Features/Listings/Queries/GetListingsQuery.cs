using AutoMapper;
using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Queries;

public class GetListingsQuery : IRequest<List<ListingDto>>
{
    public ListingCategory? Category { get; set; }
    public string? SearchTerm { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Location { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetListingsQueryHandler : IRequestHandler<GetListingsQuery, List<ListingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetListingsQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ListingDto>> Handle(GetListingsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Listings
            .Include(l => l.User)
            .Include(l => l.Images)
            .Where(l => l.Status == ListingStatus.Active && !l.IsDeleted);

        if (request.Category.HasValue)
            query = query.Where(l => l.Category == request.Category.Value);

        if (!string.IsNullOrEmpty(request.SearchTerm))
            query = query.Where(l => l.Title.Contains(request.SearchTerm) || 
                                   l.Description.Contains(request.SearchTerm));

        if (request.MinPrice.HasValue)
            query = query.Where(l => l.Price.Amount >= request.MinPrice.Value);

        if (request.MaxPrice.HasValue)
            query = query.Where(l => l.Price.Amount <= request.MaxPrice.Value);

        if (!string.IsNullOrEmpty(request.Location))
            query = query.Where(l => l.Location.Contains(request.Location));

        var listings = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ListingDto>>(listings);
    }
}