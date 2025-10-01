using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class CreateOrderCommand : IRequest<Guid>
{
    public Guid ListingId { get; set; }
    public string MeetingLocation { get; set; } = string.Empty;
    public DateTime MeetingTime { get; set; }
    public string? Notes { get; set; }
}

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");

        RuleFor(x => x.MeetingLocation)
            .NotEmpty().WithMessage("Meeting location is required")
            .MaximumLength(200).WithMessage("Meeting location must not exceed 200 characters");

        RuleFor(x => x.MeetingTime)
            .Must(BeInTheFuture).WithMessage("Meeting time must be in the future");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes must not exceed 500 characters");
    }

    private static bool BeInTheFuture(DateTime meetingTime)
    {
        return meetingTime > DateTime.UtcNow;
    }
}

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        INotificationService notificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var listing = await _context.Listings
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId, cancellationToken)
            ?? throw new InvalidOperationException("Listing not found");

        if (listing.Status != ListingStatus.Active)
            throw new InvalidOperationException("Listing is not active");

        if (!Guid.TryParse(_currentUserService.UserId, out var buyerId))
            throw new InvalidOperationException("Invalid user ID");

        var buyer = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == buyerId, cancellationToken)
            ?? throw new InvalidOperationException("Buyer not found");

        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            ListingId = request.ListingId,
            BuyerId = buyerId,
            SellerId = listing.UserId,
            TotalAmount = new Money(listing.Price.Amount, listing.Price.Currency), // Правильно копіюємо Money об'єкт
            Status = OrderStatus.Pending,
            MeetingLocation = request.MeetingLocation,
            MeetingTime = request.MeetingTime,
            Notes = request.Notes
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        // Create notification for the seller
        await _notificationService.CreateNotificationAsync(
            listing.UserId,
            "order",
            "Нове замовлення",
            $"Користувач {buyer.FirstName} {buyer.LastName} замовив ваш товар \"{listing.Title}\"",
            $"/orders/{order.Id}",
            null,
            order.Id,
            null,
            listing.Id);

        return order.Id;
    }
}