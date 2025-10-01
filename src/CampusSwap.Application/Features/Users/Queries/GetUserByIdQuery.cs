using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Users.Queries;

public class GetUserByIdQuery : IRequest<UserDto?>
{
    public Guid UserId { get; set; }
}

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDto?>
{
    private readonly IApplicationDbContext _context;

    public GetUserByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Where(u => u.Id == request.UserId)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                StudentId = u.StudentId,
                University = u.University,
                Faculty = u.Faculty,
                YearOfStudy = u.YearOfStudy,
                ProfileImageUrl = u.ProfileImageUrl,
                Rating = u.Rating,
                ReviewsCount = u.ReviewsCount,
                IsEmailVerified = u.IsEmailVerified,
                IsPhoneVerified = u.IsPhoneVerified,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        return user;
    }
}
