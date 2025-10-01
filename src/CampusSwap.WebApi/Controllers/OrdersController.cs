using CampusSwap.Application.Features.Orders.Commands;
using CampusSwap.Application.Features.Orders.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders([FromQuery] GetMyOrdersQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var result = await _mediator.Send(new GetOrderByIdQuery { Id = id });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command)
    {
        try
        {
            var id = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetOrder), new { id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/confirm")]
    public async Task<IActionResult> ConfirmOrder(Guid id)
    {
        try
        {
            await _mediator.Send(new ConfirmOrderCommand { OrderId = id });
            return Ok(new { message = "Order confirmed" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteOrder(Guid id)
    {
        try
        {
            await _mediator.Send(new CompleteOrderCommand { OrderId = id });
            return Ok(new { message = "Order completed" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id, [FromBody] CancelOrderCommand command)
    {
        try
        {
            command.OrderId = id;
            await _mediator.Send(command);
            return Ok(new { message = "Order cancelled" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/review")]
    public async Task<IActionResult> AddReview(Guid id, [FromBody] AddReviewCommand command)
    {
        try
        {
            command.OrderId = id;
            var reviewId = await _mediator.Send(command);
            return Ok(new { id = reviewId, message = "Review added successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(Guid id)
    {
        try
        {
            await _mediator.Send(new DeleteOrderCommand { OrderId = id });
            return Ok(new { message = "Order deleted successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }
}