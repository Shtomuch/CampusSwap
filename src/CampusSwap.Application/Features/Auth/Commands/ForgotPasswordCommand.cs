using MediatR;

namespace CampusSwap.Application.Features.Auth.Commands;

public class ForgotPasswordCommand : IRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    public Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        // TODO: Implement password reset
        return Task.CompletedTask;
    }
}