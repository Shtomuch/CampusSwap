using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Common;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CampusSwap.Infrastructure.Data;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<SavedListing> SavedListings => Set<SavedListing>();
    public DbSet<Notification> Notifications => Set<Notification>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = _currentUserService.UserId;
                    entry.Entity.UpdatedBy = _currentUserService.UserId;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedBy = _currentUserService.UserId;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.StudentId).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.StudentId).HasMaxLength(50);
            entity.Property(e => e.University).HasMaxLength(200);
            entity.Property(e => e.Faculty).HasMaxLength(200);
        });

        // Listing configuration
        modelBuilder.Entity<Listing>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.Condition).HasMaxLength(50);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.ISBN).HasMaxLength(20);
            entity.Property(e => e.CourseCode).HasMaxLength(20);
            entity.Property(e => e.Author).HasMaxLength(200);

            // Value object conversion for Money
            entity.OwnsOne(e => e.Price, price =>
            {
                price.Property(p => p.Amount).HasColumnName("PriceAmount").HasPrecision(18, 2);
                price.Property(p => p.Currency).HasColumnName("PriceCurrency").HasMaxLength(3);
            });

            entity.HasOne(e => e.User)
                .WithMany(u => u.Listings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ListingImage configuration
        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.Images)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrderNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            entity.Property(e => e.MeetingLocation).HasMaxLength(200);

            entity.OwnsOne(e => e.TotalAmount, amount =>
            {
                amount.Property(a => a.Amount).HasColumnName("TotalAmount").HasPrecision(18, 2);
                amount.Property(a => a.Currency).HasColumnName("Currency").HasMaxLength(3);
            });

            entity.HasOne(e => e.Buyer)
                .WithMany(u => u.BuyerOrders)
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Seller)
                .WithMany(u => u.SellerOrders)
                .HasForeignKey(e => e.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.Orders)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ChatMessage configuration
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).HasMaxLength(1000).IsRequired();

            entity.HasOne(e => e.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(e => e.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.RelatedMessages)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Conversation configuration
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.User1Id, e.User2Id }).IsUnique();
        });

        // Review configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(1000);

            entity.HasOne(e => e.Reviewer)
                .WithMany(u => u.ReviewsGiven)
                .HasForeignKey(e => e.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ReviewedUser)
                .WithMany(u => u.ReviewsReceived)
                .HasForeignKey(e => e.ReviewedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Order-Review relationships
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasOne(e => e.BuyerReview)
                .WithOne()
                .HasForeignKey<Review>("BuyerReviewOrderId")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SellerReview)
                .WithOne()
                .HasForeignKey<Review>("SellerReviewOrderId")
                .OnDelete(DeleteBehavior.Restrict);
        });

        // SavedListing configuration
        modelBuilder.Entity<SavedListing>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.ListingId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.SavedListings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.SavedByUsers)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.ActionUrl).HasMaxLength(500);
            entity.Property(e => e.Data).HasMaxLength(2000);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Order)
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Conversation)
                .WithMany()
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Listing)
                .WithMany()
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt });
        });
    }
}