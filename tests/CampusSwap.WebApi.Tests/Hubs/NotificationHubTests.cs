using System.Reflection;
using CampusSwap.WebApi.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CampusSwap.WebApi.Tests.Hubs;

public class NotificationHubTests
{
    // Очистка статичного словника підключень між тестами
    private static void ClearUserConnections()
    {
        var field = typeof(NotificationHub).GetField("_userConnections",
            BindingFlags.NonPublic | BindingFlags.Static);
        var dict = (IDictionary<string, List<string>>)field!.GetValue(null)!;
        dict.Clear();
    }

    [Fact]
    public async Task OnConnectedAsync_Adds_UserConnection()
    {
        ClearUserConnections();

        var logger = new Mock<ILogger<NotificationHub>>();
        var hub = new NotificationHub(logger.Object);

        var ctx = new TestUtils.HubTestContext(userId: "u1");
        ctx.AttachTo(hub);

        await hub.OnConnectedAsync();

        logger.Verify(l => l.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((o, _) => o.ToString()!.Contains("connected")),
            null,
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_Removes_UserConnection()
    {
        ClearUserConnections();

        var logger = new Mock<ILogger<NotificationHub>>();
        var hub = new NotificationHub(logger.Object);

        var ctx = new TestUtils.HubTestContext(userId: "u1");
        ctx.AttachTo(hub);

        await hub.OnConnectedAsync();
        await hub.OnDisconnectedAsync(null);

        logger.Verify(l => l.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((o, _) => o.ToString()!.Contains("disconnected")),
            null,
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task SendNotificationToUser_Calls_ReceiveNotification()
    {
        ClearUserConnections();

        var logger = new Mock<ILogger<NotificationHub>>();
        var hub = new NotificationHub(logger.Object);

        var ctx = new TestUtils.HubTestContext("u1");
        ctx.AttachTo(hub);

        await hub.OnConnectedAsync();

        var hubCtx = new Mock<IHubContext<NotificationHub>>();
        hubCtx.Setup(h => h.Clients.Client(It.IsAny<string>()))
              .Returns(ctx.SingleClientProxy.Object);

        await NotificationHub.SendNotificationToUser(hubCtx.Object, "u1", new { Foo = "bar" });

        ctx.SingleClientProxy.Verify(p => p.SendCoreAsync(
            "ReceiveNotification",
            It.Is<object[]>(a => a.Length == 1 && a[0].ToString()!.Contains("Foo")),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }
}