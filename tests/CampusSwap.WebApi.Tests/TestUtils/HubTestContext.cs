using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace CampusSwap.WebApi.Tests.TestUtils;

internal sealed class HubTestContext
{
    public string ConnectionId { get; }
    public ClaimsPrincipal User { get; }

    public Mock<HubCallerContext> ContextMock { get; } = new();
    public Mock<IHubCallerClients> ClientsMock { get; } = new();
    public Mock<IGroupManager> GroupsMock { get; } = new();

    // Проксі
    public Mock<ISingleClientProxy> CallerProxy { get; } = new();   
    public Mock<IClientProxy> AllProxy { get; } = new();
    public Mock<IClientProxy> OthersProxy { get; } = new();
    public Mock<IClientProxy> GroupProxy { get; } = new();
    public Mock<IClientProxy> UserProxy { get; } = new();

    public Mock<ISingleClientProxy> SingleClientProxy { get; } = new();

    public HubTestContext(string? userId = "u1", string? connectionId = null, string? userName = "user@example.com")
    {
        ConnectionId = connectionId ?? Guid.NewGuid().ToString("N");

        var claims = new List<Claim>();
        if (userId != null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        if (userName != null) claims.Add(new Claim(ClaimTypes.Name, userName));
        User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));

        // HubCallerContext
        ContextMock.SetupGet(c => c.ConnectionId).Returns(ConnectionId);
        ContextMock.SetupGet(c => c.User).Returns(User);

        // IHubCallerClients
        ClientsMock.SetupGet(c => c.Caller).Returns(CallerProxy.Object);     // ISingleClientProxy
        ClientsMock.SetupGet(c => c.All).Returns(AllProxy.Object);           // IClientProxy
        ClientsMock.SetupGet(c => c.Others).Returns(OthersProxy.Object);     // IClientProxy

        ClientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(GroupProxy.Object);
        ClientsMock.Setup(c => c.User(It.IsAny<string>())).Returns(UserProxy.Object);

        ClientsMock.Setup(c => c.Client(It.IsAny<string>())).Returns(SingleClientProxy.Object);

        // Groups
        GroupsMock.Setup(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                  .Returns(Task.CompletedTask);
        GroupsMock.Setup(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                  .Returns(Task.CompletedTask);
    }

    public void AttachTo(Hub hub)
    {
        hub.Context = ContextMock.Object;
        hub.Clients = ClientsMock.Object;
        hub.Groups  = GroupsMock.Object;
    }
}