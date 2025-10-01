using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class AddReviewCommand : IRequest<Guid>
{
    public Guid OrderId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class AddReviewCommandValidator : AbstractValidator<AddReviewCommand>
{
    public AddReviewCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Comment)
            .NotEmpty().WithMessage("Comment is required")
            .MaximumLength(1000).WithMessage("Comment must not exceed 1000 characters");
    }
}

public class AddReviewCommandHandler : IRequestHandler<AddReviewCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddReviewCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(AddReviewCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new InvalidOperationException("Order not found");

        if (!Guid.TryParse(_currentUserService.UserId, out var userId))
            throw new InvalidOperationException("Invalid user ID");

        if (order.BuyerId != userId)
            throw new UnauthorizedAccessException("You can only review your own orders");

        if (order.Status != OrderStatus.Completed)
            throw new InvalidOperationException("You can only review completed orders");

        var review = new Review
        {
            OrderId = request.OrderId,
            ReviewerId = userId,
            Rating = request.Rating,
            Comment = request.Comment
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        return review.Id;
    }
}