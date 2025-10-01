using Bogus;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;
using FluentAssertions;

namespace CampusSwap.Domain.Tests.Entities;

public class OrderTests
{
    private readonly Faker _faker = new();

    [Fact]
    public void Constructor_Should_Initialize_Properties_Correctly()
    {
        // Arrange
        var id = Guid.NewGuid();
        var listingId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var totalAmount = _faker.Random.Decimal(10, 1000);
        var meetingLocation = _faker.Address.StreetAddress();

        // Act
        var order = new Order
        {
            Id = id,
            ListingId = listingId,
            BuyerId = buyerId,
            SellerId = sellerId,
            TotalAmount = new Money(totalAmount, "UAH"),
            MeetingLocation = meetingLocation
        };

        // Assert
        order.Id.Should().Be(id);
        order.ListingId.Should().Be(listingId);
        order.BuyerId.Should().Be(buyerId);
        order.SellerId.Should().Be(sellerId);
        order.TotalAmount.Amount.Should().Be(totalAmount);
        order.TotalAmount.Currency.Should().Be("UAH");
        order.MeetingLocation.Should().Be(meetingLocation);
        order.Status.Should().Be(OrderStatus.Pending);
        order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Set_Status_To_Confirmed()
    {
        // Arrange
        var order = new Order();

        // Act
        order.Status = OrderStatus.Confirmed;

        // Assert
        order.Status.Should().Be(OrderStatus.Confirmed);
    }

    [Fact]
    public void Should_Set_Status_To_Completed()
    {
        // Arrange
        var order = new Order();

        // Act
        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;

        // Assert
        order.Status.Should().Be(OrderStatus.Completed);
        order.CompletedAt.Should().NotBeNull();
        order.CompletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Set_Status_To_Cancelled()
    {
        // Arrange
        var order = new Order();
        var cancellationReason = _faker.Lorem.Sentence();

        // Act
        order.Status = OrderStatus.Cancelled;
        order.CancellationReason = cancellationReason;

        // Assert
        order.Status.Should().Be(OrderStatus.Cancelled);
        order.CancellationReason.Should().Be(cancellationReason);
    }

    [Fact]
    public void Should_Set_MeetingTime()
    {
        // Arrange
        var order = new Order();
        var meetingTime = _faker.Date.Future();

        // Act
        order.MeetingTime = meetingTime;

        // Assert
        order.MeetingTime.Should().Be(meetingTime);
    }


    [Fact]
    public void Should_Set_Notes()
    {
        // Arrange
        var order = new Order();
        var notes = _faker.Lorem.Paragraph();

        // Act
        order.Notes = notes;

        // Assert
        order.Notes.Should().Be(notes);
    }

    [Fact]
    public void Should_Have_Default_Status_As_Pending()
    {
        // Act
        var order = new Order();

        // Assert
        order.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public void Should_Have_CreatedAt_Set_On_Creation()
    {
        // Act
        var order = new Order();

        // Assert
        order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Have_UpdatedAt_Set_On_Creation()
    {
        // Act
        var order = new Order();

        // Assert
        order.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}