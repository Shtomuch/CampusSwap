using MediatR;

namespace CampusSwap.Application.Features.Listings.Commands;

public class UpdateListingCommand : IRequest
{
    public Guid Id { get; set; }
}

public class UpdateListingCommandHandler : IRequestHandler<UpdateListingCommand>
{
    public Task Handle(UpdateListingCommand request, CancellationToken cancellationToken) => Task.CompletedTask;
}