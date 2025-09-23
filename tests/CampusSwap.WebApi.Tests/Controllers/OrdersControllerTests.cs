using CampusSwap.WebApi.Controllers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using CampusSwap.Application.Features.Orders.Queries;
using CampusSwap.Application.Features.Orders.Commands;

namespace CampusSwap.WebApi.Tests.Controllers;

public class OrdersControllerTests
{
    [Fact]
    public void Controller_Has_ClassLevel_Authorize()
    {
        typeof(OrdersController).GetCustomAttribute<AuthorizeAttribute>()
            .Should().NotBeNull();
    }

    [Fact]
    public async Task GetMyOrders_Returns_Ok_And_Sends_Query()
    {
        var mediator = new Mock<IMediator>();
        var sut = new OrdersController(mediator.Object);

        var result = await sut.GetMyOrders();

        Assert.IsType<OkObjectResult>(result);
        mediator.Verify(m => m.Send(It.IsAny<GetMyOrdersQuery>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetOrder_Returns_Ok_And_Sends_Query_With_Id()
    {
        var mediator = new Mock<IMediator>();
        var sut = new OrdersController(mediator.Object);
        var id = Guid.NewGuid();

        var result = await sut.GetOrder(id);

        Assert.IsType<OkObjectResult>(result);
        mediator.Verify(m => m.Send(It.Is<GetOrderByIdQuery>(q => q.Id == id), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrder_Returns_CreatedAt_With_Route_Id()
    {
        var mediator = new Mock<IMediator>();
        var sut = new OrdersController(mediator.Object);

        var result = await sut.CreateOrder(new CreateOrderCommand());

        var created = Assert.IsType<CreatedAtActionResult>(result);
        created.ActionName.Should().Be(nameof(OrdersController.GetOrder));
        created.RouteValues!.ContainsKey("id").Should().BeTrue();
        created.RouteValues!["id"].Should().BeOfType<Guid>();
        mediator.Verify(m => m.Send(It.IsAny<CreateOrderCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Confirm_Complete_Cancel_Review_Send_Correct_Commands()
    {
        var mediator = new Mock<IMediator>();
        var sut = new OrdersController(mediator.Object);
        var id = Guid.NewGuid();

        Assert.IsType<OkObjectResult>(await sut.ConfirmOrder(id));
        mediator.Verify(m => m.Send(It.Is<ConfirmOrderCommand>(c => c.OrderId == id), It.IsAny<CancellationToken>()), Times.Once);

        Assert.IsType<OkObjectResult>(await sut.CompleteOrder(id));
        mediator.Verify(m => m.Send(It.Is<CompleteOrderCommand>(c => c.OrderId == id), It.IsAny<CancellationToken>()), Times.Once);

        Assert.IsType<OkObjectResult>(await sut.CancelOrder(id, new CancelOrderCommand()));
        mediator.Verify(m => m.Send(It.Is<CancelOrderCommand>(c => c.OrderId == id), It.IsAny<CancellationToken>()), Times.Once);

        Assert.IsType<OkObjectResult>(await sut.AddReview(id, new AddReviewCommand()));
        mediator.Verify(m => m.Send(It.Is<AddReviewCommand>(c => c.OrderId == id), It.IsAny<CancellationToken>()), Times.Once);
    }
}