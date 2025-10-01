using CampusSwap.Application.Features.Listings.Commands;
using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using FluentAssertions;
using Moq;

namespace CampusSwap.Application.Tests.Features.Listings.Commands;

public class CreateListingCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly CreateListingCommandHandler _handler;

    public CreateListingCommandHandlerTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new CreateListingCommandHandler(_contextMock.Object, _currentUserServiceMock.Object);
    }

    [Fact]
    public async Task Handle_Should_Create_Listing_Successfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(x => x.UserId).Returns(userId.ToString());

        var command = new CreateListingCommand
        {
            Title = "Test Book",
            Description = "Test Description",
            Price = 100,
            Category = ListingCategory.Textbooks,
            Condition = "Good",
            Location = "Campus Library",
            ImageUrls = new List<string> { "image1.jpg", "image2.jpg" }
        };

        var listings = new List<Listing>();
        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1)
            .Callback(() => listings.Add(It.IsAny<Listing>()));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_Should_Set_Textbook_Specific_Properties()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(x => x.UserId).Returns(userId.ToString());

        var command = new CreateListingCommand
        {
            Title = "Computer Science Textbook",
            Description = "CS101 Textbook",
            Price = 150,
            Category = ListingCategory.Textbooks,
            Condition = "Like New",
            Location = "Student Union",
            ISBN = "978-0-123456-78-9",
            Author = "John Doe",
            CourseCode = "CS101",
            PublicationYear = 2023
        };

        var listings = new List<Listing>();
        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_Should_Set_IsNegotiable_Flag()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(x => x.UserId).Returns(userId.ToString());

        var command = new CreateListingCommand
        {
            Title = "Electronics Item",
            Description = "Laptop for sale",
            Price = 500,
            Category = ListingCategory.Electronics,
            Condition = "Good",
            Location = "Dorm Building A",
            IsNegotiable = true
        };

        var listings = new List<Listing>();
        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}