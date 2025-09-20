using AutoMapper;
using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Listings.Queries;

public class GetListingByIdQuery : IRequest<ListingDto>
{
    public Guid Id { get; set; }
}

public class GetListingByIdQueryHandler : IRequestHandler<GetListingByIdQuery, ListingDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetListingByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ListingDto> Handle(GetListingByIdQuery request, CancellationToken cancellationToken)
    {
        var listing = await _context.Listings
            .Include(l => l.User)
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == request.Id && !l.IsDeleted, cancellationToken);

        if (listing == null)
            throw new KeyNotFoundException($"Listing with ID {request.Id} not found");

        listing.ViewsCount++;
        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ListingDto>(listing);
    }
}