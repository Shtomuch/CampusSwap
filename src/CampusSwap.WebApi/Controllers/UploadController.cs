using CampusSwap.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusSwap.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public UploadController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpPost]
    [RequestSizeLimit(20_000_000)] // 20MB
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        try
        {
            Console.WriteLine($"[UploadController] Завантаження файлу: {file?.FileName}, розмір: {file?.Length} bytes");
            
            if (file == null || file.Length == 0)
            {
                Console.WriteLine("[UploadController] Помилка: файл не надіслано або порожній");
                return BadRequest(new { message = "Файл не надіслано або порожній" });
            }

            // Перевірка типу файлу
            if (!file.ContentType.StartsWith("image/"))
            {
                Console.WriteLine($"[UploadController] Помилка: недопустимий тип файлу {file.ContentType}");
                return BadRequest(new { message = "Дозволені тільки зображення" });
            }

            // Перевірка розміру файлу (5MB максимум для зображень)
            if (file.Length > 5_000_000)
            {
                Console.WriteLine($"[UploadController] Помилка: файл занадто великий {file.Length} bytes");
                return BadRequest(new { message = "Файл занадто великий. Максимальний розмір: 5MB" });
            }

            await using var stream = file.OpenReadStream();
            var url = await _fileStorageService.UploadFileAsync(stream, file.FileName, file.ContentType);
            
            Console.WriteLine($"[UploadController] Файл успішно завантажено: {url}");
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UploadController] Помилка при завантаженні файлу: {ex.Message}");
            Console.WriteLine($"[UploadController] Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Помилка при завантаженні файлу. Спробуйте ще раз." });
        }
    }
}


