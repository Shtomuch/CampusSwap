using Bogus;
using CampusSwap.Domain.Entities;
using FluentAssertions;

namespace CampusSwap.Domain.Tests.Entities;

public class UserTests
{
    private readonly Faker _faker = new();

    [Fact]
    public void Constructor_Should_Initialize_Properties_Correctly()
    {
        // Arrange
        var id = Guid.NewGuid();
        var name = _faker.Person.FullName;
        var email = _faker.Internet.Email();
        var university = _faker.Company.CompanyName();

        // Act
        var user = new User
        {
            Id = id,
            Name = name,
            Email = email,
            University = university
        };

        // Assert
        user.Id.Should().Be(id);
        user.Name.Should().Be(name);
        user.Email.Should().Be(email);
        user.University.Should().Be(university);
        user.Listings.Should().BeEmpty();
        user.Orders.Should().BeEmpty();
        user.SavedListings.Should().BeEmpty();
    }

    [Fact]
    public void Should_Have_Collections_Initialized()
    {
        // Act
        var user = new User();

        // Assert
        user.Listings.Should().NotBeNull();
        user.Orders.Should().NotBeNull();
        user.SavedListings.Should().NotBeNull();
        user.SentMessages.Should().NotBeNull();
        user.ReceivedMessages.Should().NotBeNull();
        user.UserConversations.Should().NotBeNull();
        user.RefreshTokens.Should().NotBeNull();
    }

    [Fact]
    public void Should_Set_IsEmailConfirmed_Property()
    {
        // Arrange
        var user = new User();

        // Act
        user.IsEmailConfirmed = true;

        // Assert
        user.IsEmailConfirmed.Should().BeTrue();
    }

    [Fact]
    public void Should_Set_PhoneNumber_Property()
    {
        // Arrange
        var user = new User();
        var phoneNumber = _faker.Phone.PhoneNumber();

        // Act
        user.PhoneNumber = phoneNumber;

        // Assert
        user.PhoneNumber.Should().Be(phoneNumber);
    }

    [Fact]
    public void Should_Set_ProfilePictureUrl_Property()
    {
        // Arrange
        var user = new User();
        var profilePictureUrl = _faker.Internet.Avatar();

        // Act
        user.ProfilePictureUrl = profilePictureUrl;

        // Assert
        user.ProfilePictureUrl.Should().Be(profilePictureUrl);
    }
}