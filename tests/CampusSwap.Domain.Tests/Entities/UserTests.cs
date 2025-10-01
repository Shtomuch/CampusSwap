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
        var firstName = _faker.Person.FirstName;
        var lastName = _faker.Person.LastName;
        var email = _faker.Internet.Email();
        var university = _faker.Company.CompanyName();

        // Act
        var user = new User
        {
            Id = id,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            University = university
        };

        // Assert
        user.Id.Should().Be(id);
        user.FirstName.Should().Be(firstName);
        user.LastName.Should().Be(lastName);
        user.FullName.Should().Be($"{firstName} {lastName}");
        user.Email.Should().Be(email);
        user.University.Should().Be(university);
        user.Listings.Should().BeEmpty();
        user.BuyerOrders.Should().BeEmpty();
        user.SellerOrders.Should().BeEmpty();
        user.SavedListings.Should().BeEmpty();
    }

    [Fact]
    public void Should_Have_Collections_Initialized()
    {
        // Act
        var user = new User();

        // Assert
        user.Listings.Should().NotBeNull();
        user.BuyerOrders.Should().NotBeNull();
        user.SellerOrders.Should().NotBeNull();
        user.SavedListings.Should().NotBeNull();
        user.SentMessages.Should().NotBeNull();
        user.ReceivedMessages.Should().NotBeNull();
        user.ReviewsGiven.Should().NotBeNull();
        user.ReviewsReceived.Should().NotBeNull();
    }

    [Fact]
    public void Should_Set_IsEmailVerified_Property()
    {
        // Arrange
        var user = new User();

        // Act
        user.IsEmailVerified = true;

        // Assert
        user.IsEmailVerified.Should().BeTrue();
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
    public void Should_Set_ProfileImageUrl_Property()
    {
        // Arrange
        var user = new User();
        var profileImageUrl = _faker.Internet.Avatar();

        // Act
        user.ProfileImageUrl = profileImageUrl;

        // Assert
        user.ProfileImageUrl.Should().Be(profileImageUrl);
    }
}