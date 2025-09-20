using CampusSwap.Application.Common.Interfaces;
using MediatR;

namespace CampusSwap.Application.Features.Chat.Commands;

public class MarkMessagesAsReadCommand : IRequest<bool>
{
    public Guid ConversationId { get; set; }
}

public class MarkMessagesAsReadCommandHandler : IRequestHandler<MarkMessagesAsReadCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public MarkMessagesAsReadCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(MarkMessagesAsReadCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // For now, return true as stub implementation
        return true;
    }
}