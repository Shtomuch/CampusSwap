using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Application.Features.Chat.Commands;
using MediatR;

namespace CampusSwap.Application.Features.Chat.Queries;

public class ConversationDto
{
    public Guid Id { get; set; }
    public Guid OtherUserId { get; set; }
    public string OtherUserName { get; set; } = string.Empty;
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public DateTime LastMessageAt { get; set; }
}

public class GetMyConversationsQuery : IRequest<List<ConversationDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetMyConversationsQueryHandler : IRequestHandler<GetMyConversationsQuery, List<ConversationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyConversationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<ConversationDto>> Handle(GetMyConversationsQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUserService.UserId, out var currentUserId))
            throw new InvalidOperationException("Invalid user ID");

        // For now, return empty list as stub implementation
        return new List<ConversationDto>();
    }
}