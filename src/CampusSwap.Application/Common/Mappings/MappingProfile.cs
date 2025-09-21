using AutoMapper;
using CampusSwap.Domain.Entities;
using CampusSwap.Application.Features.Listings.Queries;
using CampusSwap.Application.Features.Users.Queries;
using CampusSwap.Application.Features.Orders.Queries;
using CampusSwap.Application.Features.Reviews.Queries;

namespace CampusSwap.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Listing, ListingDto>()
            .ForMember(d => d.SellerName, opt => opt.MapFrom(s => s.User.FullName))
            .ForMember(d => d.ImageUrls, opt => opt.MapFrom(s => s.Images.Select(i => i.ImageUrl)));
        
        CreateMap<User, UserDto>();
        CreateMap<Order, OrderDto>();
        CreateMap<ListingImage, ListingImageDto>();
        CreateMap<Review, ReviewDto>();
    }
}