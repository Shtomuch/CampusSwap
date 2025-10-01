using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using CampusSwap.Application.Features.Chat.Queries;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        try
        {
            var query = new GetMyConversationsQuery();
            var conversations = await _mediator.Send(query);
            return Ok(conversations);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("conversations/{conversationId}/messages")]
    public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = new GetConversationMessagesQuery
            {
                OtherUserId = conversationId,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            var messages = await _mediator.Send(query);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
