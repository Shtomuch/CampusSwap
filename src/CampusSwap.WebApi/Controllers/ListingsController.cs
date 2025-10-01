using CampusSwap.Application.Features.Listings.Commands;
using CampusSwap.Application.Features.Listings.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyListings()
    {
        try
        {
            Console.WriteLine("[ListingsController] Отримання оголошень поточного користувача");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[ListingsController] ❌ User ID не знайдено в токені");
                return Unauthorized("User ID not found in token.");
            }

            Console.WriteLine($"[ListingsController] 🔍 Запит оголошень для користувача: {userId}");
            
            var query = new GetListingsByUserQuery { UserId = userId };
            var result = await _mediator.Send(query);
            
            Console.WriteLine($"[ListingsController] ✅ Знайдено {result.Count} оголошень користувача");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ListingsController] ❌ Помилка при отриманні оголошень користувача: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateListing([FromBody] CreateListingCommand command)
    {
        try
        {
            Console.WriteLine($"[ListingsController] Створення оголошення: Title='{command.Title}', Category={command.Category}, Price={command.Price}");
            Console.WriteLine($"[ListingsController] Зображення: {command.ImageUrls?.Count ?? 0} файлів");
            
            var id = await _mediator.Send(command);
            Console.WriteLine($"[ListingsController] Оголошення успішно створено з ID: {id}");
            
            return CreatedAtAction(nameof(GetListing), new { id }, new { id });
        }
        catch (FluentValidation.ValidationException ex)
        {
            Console.WriteLine($"[ListingsController] Помилка валідації: {ex.Message}");
            
            var errors = ex.Errors.GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            
            return BadRequest(new { 
                message = "One or more validation errors occurred.",
                errors = errors
            });
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"[ListingsController] Помилка операції: {ex.Message}");
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"[ListingsController] Помилка доступу: {ex.Message}");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ListingsController] Неочікувана помилка: {ex.Message}");
            Console.WriteLine($"[ListingsController] Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Внутрішня помилка сервера. Спробуйте ще раз." });
        }
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


    [HttpGet("saved")]
    [Authorize]
    public async Task<IActionResult> GetSavedListings()
    {
        var result = await _mediator.Send(new GetSavedListingsQuery());
        return Ok(result);
    }
}