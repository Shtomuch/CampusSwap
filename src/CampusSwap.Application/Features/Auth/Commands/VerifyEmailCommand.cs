using MediatR;

namespace CampusSwap.Application.Features.Auth.Commands;

public class VerifyEmailCommand : IRequest
{
    public string Token { get; set; } = string.Empty;
}

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand>
{
    public Task Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        // TODO: Implement email verification
        return Task.CompletedTask;
    }
}