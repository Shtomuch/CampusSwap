using CampusSwap.WebApi.Controllers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using CampusSwap.Application.Features.Listings.Queries;
using CampusSwap.Application.Features.Listings.Commands;

namespace CampusSwap.WebApi.Tests.Controllers;

public class ListingsControllerTests
{
    [Fact]
    public async Task GetListings_Returns_Ok_And_Sends_Query()
    {
        var mediator = new Mock<IMediator>();
        var sut = new ListingsController(mediator.Object);

        var result = await sut.GetListings(new GetListingsQuery());

        Assert.IsType<OkObjectResult>(result);
        mediator.Verify(m => m.Send(It.IsAny<GetListingsQuery>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetListing_Returns_Ok_And_Sends_Query_With_Id()
    {
        var mediator = new Mock<IMediator>();
        var sut = new ListingsController(mediator.Object);
        var id = Guid.NewGuid();

        var result = await sut.GetListing(id);

        Assert.IsType<OkObjectResult>(result);
        mediator.Verify(m => m.Send(It.Is<GetListingByIdQuery>(q => q.Id == id), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateListing_Returns_CreatedAt_With_Route_Id()
    {
        var mediator = new Mock<IMediator>();
        var sut = new ListingsController(mediator.Object);

        var result = await sut.CreateListing(new CreateListingCommand());

        var created = Assert.IsType<CreatedAtActionResult>(result);
        created.ActionName.Should().Be(nameof(ListingsController.GetListing));
        created.RouteValues!.ContainsKey("id").Should().BeTrue();
        created.RouteValues!["id"].Should().BeOfType<Guid>();
    }

    [Fact]
    public async Task UpdateListing_Returns_NoContent_And_Passes_Route_Id_To_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new ListingsController(mediator.Object);
        var id = Guid.NewGuid();

        var result = await sut.UpdateListing(id, new UpdateListingCommand());

        Assert.IsType<NoContentResult>(result);
        mediator.Verify(m => m.Send(It.Is<UpdateListingCommand>(c => c.Id == id), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteListing_Returns_NoContent_And_Passes_Id()
    {
        var mediator = new Mock<IMediator>();
        var sut = new ListingsController(mediator.Object);
        var id = Guid.NewGuid();

        var result = await sut.DeleteListing(id);

        Assert.IsType<NoContentResult>(result);
        mediator.Verify(m => m.Send(It.Is<DeleteListingCommand>(c => c.Id == id), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void Protected_Actions_Have_Authorize()
    {
        var t = typeof(ListingsController);
        string[] methods = {
            nameof(ListingsController.CreateListing),
            nameof(ListingsController.UpdateListing),
            nameof(ListingsController.DeleteListing),
            nameof(ListingsController.SaveListing),
            nameof(ListingsController.UnsaveListing),
            nameof(ListingsController.GetMyListings),
            nameof(ListingsController.GetSavedListings)
        };

        foreach (var m in methods)
        {
            var hasAuthorize = t.GetMethod(m)!.GetCustomAttribute<AuthorizeAttribute>() != null;
            hasAuthorize.Should().BeTrue($"method {m} must have [Authorize]");
        }
    }
}