using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Orders.Commands;

public class DeleteOrderCommand : IRequest
{
    public Guid OrderId { get; set; }
}

public class DeleteOrderCommandValidator : AbstractValidator<DeleteOrderCommand>
{
    public DeleteOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");
    }
}

public class DeleteOrderCommandHandler : IRequestHandler<DeleteOrderCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteOrderCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(DeleteOrderCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new InvalidOperationException("Order not found");

        // Перевіряємо, чи користувач є власником замовлення (покупець або продавець)
        if (order.BuyerId != currentUserId && order.SellerId != currentUserId)
            throw new UnauthorizedAccessException("You can only delete your own orders");

        // Можна видаляти тільки замовлення в статусі Pending або Cancelled
        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Cancelled)
            throw new InvalidOperationException("Cannot delete orders that are confirmed or completed");

        // Видаляємо замовлення
        _context.Orders.Remove(order);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
