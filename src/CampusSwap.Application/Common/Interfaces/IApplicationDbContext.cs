using CampusSwap.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Listing> Listings { get; }
    DbSet<ListingImage> ListingImages { get; }
    DbSet<Order> Orders { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<Review> Reviews { get; }
    DbSet<SavedListing> SavedListings { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}