using CampusSwap.Application.Features.Listings.Queries;
using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace CampusSwap.Application.Tests.Features.Listings.Queries;

public class GetListingsQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly GetListingsQueryHandler _handler;

    public GetListingsQueryHandlerTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _handler = new GetListingsQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_Should_Return_Active_Listings()
    {
        // Arrange
        var listings = new List<Listing>
        {
            new() { Id = Guid.NewGuid(), Title = "Book 1", Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Title = "Book 2", Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow.AddHours(-1) },
            new() { Id = Guid.NewGuid(), Title = "Book 3", Status = ListingStatus.Sold, CreatedAt = DateTime.UtcNow.AddHours(-2) }
        };

        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);

        var query = new GetListingsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(x => x.Status == ListingStatus.Active);
    }

    [Fact]
    public async Task Handle_Should_Filter_By_Category()
    {
        // Arrange
        var listings = new List<Listing>
        {
            new() { Id = Guid.NewGuid(), Title = "Textbook", Category = ListingCategory.Textbooks, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Laptop", Category = ListingCategory.Electronics, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Notes", Category = ListingCategory.StudyMaterials, Status = ListingStatus.Active }
        };

        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);

        var query = new GetListingsQuery { Category = ListingCategory.Textbooks };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.First().Title.Should().Be("Textbook");
    }

    [Fact]
    public async Task Handle_Should_Filter_By_Search_Term()
    {
        // Arrange
        var listings = new List<Listing>
        {
            new() { Id = Guid.NewGuid(), Title = "Computer Science Book", Description = "CS fundamentals", Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Math Textbook", Description = "Calculus and algebra", Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Programming Guide", Description = "Learn computer programming", Status = ListingStatus.Active }
        };

        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);

        var query = new GetListingsQuery { SearchTerm = "computer" };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_Should_Filter_By_Price_Range()
    {
        // Arrange
        var listings = new List<Listing>
        {
            new() { Id = Guid.NewGuid(), Title = "Cheap Book", Price = 10, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Medium Book", Price = 50, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Expensive Book", Price = 100, Status = ListingStatus.Active }
        };

        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);

        var query = new GetListingsQuery { MinPrice = 20, MaxPrice = 75 };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.First().Title.Should().Be("Medium Book");
    }

    [Fact]
    public async Task Handle_Should_Sort_By_Date_Descending()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var listings = new List<Listing>
        {
            new() { Id = Guid.NewGuid(), Title = "Old", CreatedAt = now.AddDays(-3), Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Newest", CreatedAt = now, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Middle", CreatedAt = now.AddDays(-1), Status = ListingStatus.Active }
        };

        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);

        var query = new GetListingsQuery { SortBy = "date" };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.First().Title.Should().Be("Newest");
        result.Last().Title.Should().Be("Old");
    }

    [Fact]
    public async Task Handle_Should_Sort_By_Price_Ascending()
    {
        // Arrange
        var listings = new List<Listing>
        {
            new() { Id = Guid.NewGuid(), Title = "Mid", Price = 50, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Cheap", Price = 10, Status = ListingStatus.Active },
            new() { Id = Guid.NewGuid(), Title = "Expensive", Price = 100, Status = ListingStatus.Active }
        };

        var mockSet = MockDbSet.Create(listings);
        _contextMock.Setup(x => x.Listings).Returns(mockSet.Object);

        var query = new GetListingsQuery { SortBy = "price" };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.First().Title.Should().Be("Cheap");
        result.Last().Title.Should().Be("Expensive");
    }
}