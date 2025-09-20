using CampusSwap.Application.Features.Listings.Commands;
using CampusSwap.Application.Features.Listings.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ListingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetListings([FromQuery] GetListingsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetListing(Guid id)
    {
        var result = await _mediator.Send(new GetListingByIdQuery { Id = id });
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateListing([FromBody] CreateListingCommand command)
    {
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetListing), new { id }, new { id });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateListing(Guid id, [FromBody] UpdateListingCommand command)
    {
        command.Id = id;
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteListing(Guid id)
    {
        await _mediator.Send(new DeleteListingCommand { Id = id });
        return NoContent();
    }

    [HttpPost("{id}/save")]
    [Authorize]
    public async Task<IActionResult> SaveListing(Guid id)
    {
        await _mediator.Send(new SaveListingCommand { ListingId = id });
        return Ok(new { message = "Listing saved" });
    }

    [HttpDelete("{id}/save")]
    [Authorize]
    public async Task<IActionResult> UnsaveListing(Guid id)
    {
        await _mediator.Send(new UnsaveListingCommand { ListingId = id });
        return Ok(new { message = "Listing unsaved" });
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyListings()
    {
        var result = await _mediator.Send(new GetMyListingsQuery());
        return Ok(result);
    }

    [HttpGet("saved")]
    [Authorize]
    public async Task<IActionResult> GetSavedListings()
    {
        var result = await _mediator.Send(new GetSavedListingsQuery());
        return Ok(result);
    }
}