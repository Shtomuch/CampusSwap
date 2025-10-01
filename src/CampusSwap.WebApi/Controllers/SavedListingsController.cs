using CampusSwap.Application.Features.Listings.Queries;
using CampusSwap.Application.Features.SavedListings.Commands;
using CampusSwap.Application.Features.SavedListings.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/saved-listings")]
[Authorize]
public class SavedListingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SavedListingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetSavedListings()
    {
        try
        {
            Console.WriteLine("[SavedListingsController] Отримання збережених оголошень користувача");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[SavedListingsController] ❌ User ID не знайдено в токені");
                return Unauthorized("User ID not found in token.");
            }

            Console.WriteLine($"[SavedListingsController] 🔍 Запит збережених оголошень для користувача: {userId}");
            
            var query = new GetSavedListingIdsQuery { UserId = userId };
            var savedListingIds = await _mediator.Send(query);
            
            Console.WriteLine($"[SavedListingsController] ✅ Знайдено {savedListingIds.Count} збережених оголошень");
            return Ok(savedListingIds);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SavedListingsController] ❌ Помилка при отриманні збережених оголошень: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> SaveListing([FromBody] SaveListingRequest request)
    {
        try
        {
            Console.WriteLine($"[SavedListingsController] Збереження оголошення: {request.ListingId}");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[SavedListingsController] ❌ User ID не знайдено в токені");
                return Unauthorized("User ID not found in token.");
            }

            var command = new SaveListingCommand
            {
                UserId = userId,
                ListingId = request.ListingId
            };

            await _mediator.Send(command);
            
            Console.WriteLine($"[SavedListingsController] ✅ Оголошення {request.ListingId} збережено для користувача {userId}");
            return Ok(new { message = "Listing saved successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SavedListingsController] ❌ Помилка при збереженні оголошення: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{listingId}")]
    public async Task<IActionResult> RemoveSavedListing(string listingId)
    {
        try
        {
            Console.WriteLine($"[SavedListingsController] Видалення збереженого оголошення: {listingId}");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[SavedListingsController] ❌ User ID не знайдено в токені");
                return Unauthorized("User ID not found in token.");
            }

            var command = new RemoveSavedListingCommand
            {
                UserId = userId,
                ListingId = Guid.Parse(listingId)
            };

            await _mediator.Send(command);
            
            Console.WriteLine($"[SavedListingsController] ✅ Оголошення {listingId} видалено з збережених для користувача {userId}");
            return Ok(new { message = "Listing removed from saved successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SavedListingsController] ❌ Помилка при видаленні збереженого оголошення: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class SaveListingRequest
{
    public string ListingId { get; set; } = string.Empty;
}
