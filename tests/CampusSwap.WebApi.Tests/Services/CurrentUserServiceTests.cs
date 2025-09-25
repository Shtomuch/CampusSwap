// tests/CampusSwap.WebApi.Tests/Services/CurrentUserServiceTests.cs
using System.Security.Claims;
using CampusSwap.WebApi.Services;
using CampusSwap.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;
using FluentAssertions;

namespace CampusSwap.WebApi.Tests.Services;

public class CurrentUserServiceTests
{
    private static CurrentUserService CreateService(HttpContext? httpContext = null)
    {
        var accessor = new Mock<IHttpContextAccessor>();
        accessor.Setup(a => a.HttpContext).Returns(httpContext);
        return new CurrentUserService(accessor.Object);
    }

    private static HttpContext MakeContext(
        bool isAuthenticated = true,
        string? userId = "u-123",
        string? email = "user@example.com")
    {
        var ctx = new DefaultHttpContext();

        var claims = new List<Claim>();
        if (userId != null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        if (email != null)  claims.Add(new Claim(ClaimTypes.Email, email));

        var identity = new ClaimsIdentity(claims, isAuthenticated ? "TestAuth" : "");
        var principal = new ClaimsPrincipal(identity);
        ctx.User = principal;

        return ctx;
    }

    [Fact]
    public void User_With_Claims_Returns_UserId_Email_And_IsAuthenticated_True()
    {
        var ctx = MakeContext(isAuthenticated: true, userId: "abc", email: "a@b.com");
        var svc = CreateService(ctx);

        svc.UserId.Should().Be("abc");
        svc.Email.Should().Be("a@b.com");
        svc.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public void User_Without_Claims_Returns_Nulls_But_IsAuthenticated_Respects_Identity()
    {
        var ctx = MakeContext(isAuthenticated: true, userId: null, email: null);
        var svc = CreateService(ctx);

        svc.UserId.Should().BeNull();
        svc.Email.Should().BeNull();
        svc.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public void Unauthenticated_User_Returns_IsAuthenticated_False()
    {
        var ctx = MakeContext(isAuthenticated: false, userId: "abc", email: "a@b.com");
        var svc = CreateService(ctx);

        svc.IsAuthenticated.Should().BeFalse();
        // властивості читаються з клеймів незалежно від IsAuthenticated
        svc.UserId.Should().Be("abc");
        svc.Email.Should().Be("a@b.com");
    }

    [Fact]
    public void No_HttpContext_Returns_Defaults()
    {
        var svc = CreateService(httpContext: null);

        svc.UserId.Should().BeNull();
        svc.Email.Should().BeNull();
        svc.IsAuthenticated.Should().BeFalse();
    }

    [Fact]
    public void Multiple_NameIdentifier_Claims_Takes_First()
    {
        var ctx = new DefaultHttpContext();
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "first"),
            new Claim(ClaimTypes.NameIdentifier, "second"),
            new Claim(ClaimTypes.Email, "a@b.com")
        };
        ctx.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var svc = CreateService(ctx);

        svc.UserId.Should().Be("first");
    }
}
