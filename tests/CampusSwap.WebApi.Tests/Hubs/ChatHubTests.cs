using CampusSwap.WebApi.Hubs;
using CampusSwap.WebApi.Tests.TestUtils;
using MediatR;

namespace CampusSwap.WebApi.Tests.Hubs;

public class ChatHubTests
{
    [Fact]
    public async Task OnConnectedAsync_Adds_User_And_Notifies_All()
    {
        var mediator = new Mock<IMediator>();
        var logger = new Mock<ILogger<ChatHub>>();
        var hub = new ChatHub(mediator.Object, logger.Object);

        var ctx = new HubTestContext(userId: "u1");
        ctx.AttachTo(hub);

        await hub.OnConnectedAsync();

        ctx.AllProxy.Verify(p => p.SendCoreAsync(
            "UserConnected",
            It.Is<object[]>(a => (string)a[0] == "u1"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SendMessage_Without_User_Sends_Error()
    {
        var mediator = new Mock<IMediator>();
        var logger = new Mock<ILogger<ChatHub>>();
        var hub = new ChatHub(mediator.Object, logger.Object);

        // контекст без користувача
        var ctx = new HubTestContext(userId: null);
        ctx.AttachTo(hub);

        await hub.SendMessage("u2", "hello");

        ctx.CallerProxy.Verify(p => p.SendCoreAsync(
            "Error",
            It.Is<object[]>(a => ((string)a[0]).Contains("not authenticated")),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task JoinConversation_Adds_Group_And_Notifies_Caller()
    {
        var mediator = new Mock<IMediator>();
        var logger = new Mock<ILogger<ChatHub>>();
        var hub = new ChatHub(mediator.Object, logger.Object);

        var ctx = new HubTestContext("u1");
        ctx.AttachTo(hub);

        await hub.JoinConversation("conv1");

        ctx.GroupsMock.Verify(g => g.AddToGroupAsync(ctx.ConnectionId, "conversation_conv1", It.IsAny<CancellationToken>()),
            Times.Once);

        ctx.CallerProxy.Verify(p => p.SendCoreAsync(
            "JoinedConversation",
            It.Is<object[]>(a => (string)a[0] == "conv1"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LeaveConversation_Removes_Group_And_Notifies_Caller()
    {
        var mediator = new Mock<IMediator>();
        var logger = new Mock<ILogger<ChatHub>>();
        var hub = new ChatHub(mediator.Object, logger.Object);

        var ctx = new HubTestContext("u1");
        ctx.AttachTo(hub);

        await hub.LeaveConversation("conv1");

        ctx.GroupsMock.Verify(g => g.RemoveFromGroupAsync(ctx.ConnectionId, "conversation_conv1", It.IsAny<CancellationToken>()),
            Times.Once);

        ctx.CallerProxy.Verify(p => p.SendCoreAsync(
            "LeftConversation",
            It.Is<object[]>(a => (string)a[0] == "conv1"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }
}