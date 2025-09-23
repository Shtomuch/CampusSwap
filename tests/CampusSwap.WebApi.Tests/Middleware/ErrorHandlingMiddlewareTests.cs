using System.Text.Json;
using System.Net;
using CampusSwap.WebApi.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace CampusSwap.WebApi.Tests.Middleware;

public class ErrorHandlingMiddlewareTests
{
    // payload, який повертає мідлвара
    private record ErrorPayload(int StatusCode, string Message, DateTime Timestamp);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true 
    };

    private static (DefaultHttpContext ctx, ErrorHandlingMiddleware mw) Arrange(RequestDelegate next)
    {
        var logger = new Mock<ILogger<ErrorHandlingMiddleware>>();
        var ctx = new DefaultHttpContext();
        ctx.Response.Body = new MemoryStream(); 
        var mw = new ErrorHandlingMiddleware(next, logger.Object);
        return (ctx, mw);
    }

    private static async Task<string> InvokeAndReadBody(ErrorHandlingMiddleware mw, HttpContext ctx)
    {
        await mw.InvokeAsync(ctx);
        ctx.Response.Body.Position = 0;
        using var reader = new StreamReader(ctx.Response.Body);
        return await reader.ReadToEndAsync();
    }

    private static ErrorPayload Deserialize(string body)
    {
        var payload = JsonSerializer.Deserialize<ErrorPayload>(body, JsonOpts);
        payload.Should().NotBeNull("middleware must return JSON body");
        return payload!;
    }

    [Fact]
    public async Task Invoke_NoException_PassesThrough_ResponseUnchanged()
    {
        var (ctx, mw) = Arrange(async http =>
        {
            http.Response.StatusCode = (int)HttpStatusCode.OK;
            await http.Response.WriteAsync("OK");
        });

        var body = await InvokeAndReadBody(mw, ctx);

        ctx.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);
        body.Should().Be("OK");
    }

    [Fact]
    public async Task Invoke_InvalidOperationException_Returns_400_With_Body()
    {
        var (ctx, mw) = Arrange(_ => throw new InvalidOperationException("bad input"));

        var body = await InvokeAndReadBody(mw, ctx);
        var json = Deserialize(body);

        ctx.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        ctx.Response.ContentType.Should().Be("application/json");

        json.StatusCode.Should().Be(400);
        json.Message.Should().NotBeNullOrWhiteSpace();
        json.Timestamp.Should().BeBefore(DateTime.UtcNow.AddSeconds(5));
    }

    [Fact]
    public async Task Invoke_UnauthorizedAccessException_Returns_401_With_Body()
    {
        var (ctx, mw) = Arrange(_ => throw new UnauthorizedAccessException("any"));

        var body = await InvokeAndReadBody(mw, ctx);
        var json = Deserialize(body);

        ctx.Response.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        ctx.Response.ContentType.Should().Be("application/json");

        json.StatusCode.Should().Be(401);
        json.Message.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Invoke_KeyNotFoundException_Returns_404_With_Body()
    {
        var (ctx, mw) = Arrange(_ => throw new KeyNotFoundException("missing"));

        var body = await InvokeAndReadBody(mw, ctx);
        var json = Deserialize(body);

        ctx.Response.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        ctx.Response.ContentType.Should().Be("application/json");

        json.StatusCode.Should().Be(404);
        json.Message.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Invoke_AnyOtherException_Returns_500_With_Body()
    {
        var (ctx, mw) = Arrange(_ => throw new Exception("boom"));

        var body = await InvokeAndReadBody(mw, ctx);
        var json = Deserialize(body);

        ctx.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        ctx.Response.ContentType.Should().Be("application/json");

        json.StatusCode.Should().Be(500);
        json.Message.Should().NotBeNullOrWhiteSpace();
    }
}