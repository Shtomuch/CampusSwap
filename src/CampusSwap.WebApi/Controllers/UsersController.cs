using CampusSwap.Application.Features.Users.Queries;
using CampusSwap.Application.Features.Users.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IMediator mediator, ILogger<UsersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            Console.WriteLine("[UsersController] Отримання поточного користувача");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[UsersController] ❌ User ID не знайдено в токені");
                return Unauthorized(new { message = "Користувач не авторизований" });
            }

            Console.WriteLine($"[UsersController] 🔍 Запит користувача з ID: {userId}");

            var query = new GetUserByIdQuery { UserId = Guid.Parse(userId) };
            var result = await _mediator.Send(query);
            
            if (result == null)
            {
                Console.WriteLine("[UsersController] ❌ Користувач не знайдений в базі даних");
                return NotFound(new { message = "Користувач не знайдений" });
            }

            Console.WriteLine($"[UsersController] ✅ Користувач знайдений: {result.FirstName} {result.LastName} ({result.Email})");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UsersController] ❌ Помилка при отриманні користувача: {ex.Message}");
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Внутрішня помилка сервера" });
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            Console.WriteLine("[UsersController] Оновлення профілю користувача");
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("[UsersController] ❌ User ID не знайдено в токені");
                return Unauthorized(new { message = "Користувач не авторизований" });
            }

            Console.WriteLine($"[UsersController] 🔍 Оновлення профілю для користувача: {userId}");
            Console.WriteLine($"[UsersController] 📝 Дані: FirstName={request.FirstName}, LastName={request.LastName}, PhoneNumber={request.PhoneNumber}");

            var command = new UpdateUserProfileCommand
            {
                UserId = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber
            };

            await _mediator.Send(command);
            
            Console.WriteLine("[UsersController] ✅ Профіль успішно оновлено");
            return Ok(new { message = "Профіль успішно оновлено" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UsersController] ❌ Помилка при оновленні профілю: {ex.Message}");
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(500, new { message = "Внутрішня помилка сервера" });
        }
    }
}

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}
