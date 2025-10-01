using System.Net;
using System.Text.Json;

namespace CampusSwap.WebApi.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ErrorResponse();

        switch (exception)
        {
            case InvalidOperationException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = exception.Message;
                break;
            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Несанкціонований доступ";
                break;
            case KeyNotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = "Ресурс не знайдено";
                break;
            case System.Text.Json.JsonException jsonEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = $"Помилка формату JSON: {jsonEx.Message}";
                break;
            case ArgumentException argEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = $"Невірний аргумент: {argEx.Message}";
                break;
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "Сталася помилка під час обробки запиту";
                break;
        }

        context.Response.StatusCode = response.StatusCode;

        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}