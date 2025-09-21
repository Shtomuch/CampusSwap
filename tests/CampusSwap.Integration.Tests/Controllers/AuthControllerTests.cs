using System.Net;
using System.Net.Http.Json;
using CampusSwap.Application.Features.Auth.Commands;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CampusSwap.Integration.Tests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task Register_Should_Create_New_User()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            Email = "test@university.edu",
            Password = "Test123!",
            Name = "Test User",
            University = "Test University"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<dynamic>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Register_Should_Fail_With_Invalid_Email()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            Email = "invalid-email",
            Password = "Test123!",
            Name = "Test User",
            University = "Test University"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_Should_Fail_With_Weak_Password()
    {
        // Arrange
        var command = new RegisterUserCommand
        {
            Email = "test2@university.edu",
            Password = "weak",
            Name = "Test User",
            University = "Test University"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_Should_Return_JWT_Token()
    {
        // Arrange
        var registerCommand = new RegisterUserCommand
        {
            Email = "login@university.edu",
            Password = "Test123!",
            Name = "Login Test",
            University = "Test University"
        };
        await _client.PostAsJsonAsync("/api/auth/register", registerCommand);

        var loginCommand = new LoginUserCommand
        {
            Email = "login@university.edu",
            Password = "Test123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginCommand);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadAsStringAsync();
        result.Should().Contain("accessToken");
        result.Should().Contain("refreshToken");
    }

    [Fact]
    public async Task Login_Should_Fail_With_Wrong_Password()
    {
        // Arrange
        var registerCommand = new RegisterUserCommand
        {
            Email = "wrong@university.edu",
            Password = "Test123!",
            Name = "Wrong Test",
            University = "Test University"
        };
        await _client.PostAsJsonAsync("/api/auth/register", registerCommand);

        var loginCommand = new LoginUserCommand
        {
            Email = "wrong@university.edu",
            Password = "WrongPassword!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginCommand);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_Should_Fail_With_NonExistent_User()
    {
        // Arrange
        var loginCommand = new LoginUserCommand
        {
            Email = "nonexistent@university.edu",
            Password = "Test123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginCommand);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}