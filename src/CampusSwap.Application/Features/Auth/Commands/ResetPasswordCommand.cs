using MediatR;

namespace CampusSwap.Application.Features.Auth.Commands;

public class ResetPasswordCommand : IRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    public Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        // TODO: Implement password reset
        return Task.CompletedTask;
    }
}