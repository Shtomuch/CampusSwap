using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using CampusSwap.Application.Features.Chat.Commands;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestController : ControllerBase
{
    private readonly IMediator _mediator;

    public TestController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("message")]
    public async Task<IActionResult> TestMessage([FromBody] TestMessageRequest request)
    {
        try
        {
            Console.WriteLine($"[TestController] Testing SendMessageCommand...");
            Console.WriteLine($"[TestController] ReceiverId: {request.ReceiverId}");
            Console.WriteLine($"[TestController] Content: {request.Content}");
            
            var command = new SendMessageCommand
            {
                ReceiverId = request.ReceiverId,
                Content = request.Content
            };

            var result = await _mediator.Send(command);
            
            Console.WriteLine($"[TestController] ✅ Message sent successfully: {result.Id}");
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TestController] ❌ Error: {ex.Message}");
            Console.WriteLine($"[TestController] ❌ Stack: {ex.StackTrace}");
            return BadRequest(new { message = ex.Message, stackTrace = ex.StackTrace });
        }
    }
}

public class TestMessageRequest
{
    public Guid ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
}
