using Bogus;
using CampusSwap.Domain.Entities;
using CampusSwap.Domain.Enums;
using CampusSwap.Domain.ValueObjects;
using FluentAssertions;

namespace CampusSwap.Domain.Tests.Entities;

public class ListingTests
{
    private readonly Faker _faker = new();

    [Fact]
    public void Constructor_Should_Initialize_Properties_Correctly()
    {
        // Arrange
        var id = Guid.NewGuid();
        var title = _faker.Commerce.ProductName();
        var description = _faker.Commerce.ProductDescription();
        var price = _faker.Random.Decimal(10, 1000);
        var category = ListingCategory.Textbooks;
        var condition = "Like New";
        var location = _faker.Address.StreetAddress();

        // Act
        var listing = new Listing
        {
            Id = id,
            Title = title,
            Description = description,
            Price = new Money(price, "UAH"),
            Category = category,
            Condition = condition,
            Location = location
        };

        // Assert
        listing.Id.Should().Be(id);
        listing.Title.Should().Be(title);
        listing.Description.Should().Be(description);
        listing.Price.Amount.Should().Be(price);
        listing.Price.Currency.Should().Be("UAH");
        listing.Category.Should().Be(category);
        listing.Condition.Should().Be(condition);
        listing.Location.Should().Be(location);
        listing.Status.Should().Be(ListingStatus.Active);
        listing.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Have_Collections_Initialized()
    {
        // Act
        var listing = new Listing();

        // Assert
        listing.Images.Should().NotBeNull();
        listing.SavedByUsers.Should().NotBeNull();
        listing.Orders.Should().NotBeNull();
        listing.RelatedMessages.Should().NotBeNull();
    }

    [Fact]
    public void Should_Set_ISBN_For_Textbook()
    {
        // Arrange
        var listing = new Listing { Category = ListingCategory.Textbooks };
        var isbn = _faker.Commerce.Ean13();

        // Act
        listing.ISBN = isbn;

        // Assert
        listing.ISBN.Should().Be(isbn);
    }

    [Fact]
    public void Should_Set_Author_For_Textbook()
    {
        // Arrange
        var listing = new Listing { Category = ListingCategory.Textbooks };
        var author = _faker.Person.FullName;

        // Act
        listing.Author = author;

        // Assert
        listing.Author.Should().Be(author);
    }

    [Fact]
    public void Should_Set_CourseCode_For_StudyMaterials()
    {
        // Arrange
        var listing = new Listing { Category = ListingCategory.StudyMaterials };
        var courseCode = "CS101";

        // Act
        listing.CourseCode = courseCode;

        // Assert
        listing.CourseCode.Should().Be(courseCode);
    }

    [Fact]
    public void Should_Set_PublicationYear_For_Textbook()
    {
        // Arrange
        var listing = new Listing { Category = ListingCategory.Textbooks };
        var year = _faker.Random.Int(2000, 2024);

        // Act
        listing.PublicationYear = year;

        // Assert
        listing.PublicationYear.Should().Be(year);
    }

    [Fact]
    public void Should_Set_IsNegotiable_Property()
    {
        // Arrange
        var listing = new Listing();

        // Act
        listing.IsNegotiable = true;

        // Assert
        listing.IsNegotiable.Should().BeTrue();
    }

    [Fact]
    public void Should_Set_Status_Property()
    {
        // Arrange
        var listing = new Listing();

        // Act
        listing.Status = ListingStatus.Sold;

        // Assert
        listing.Status.Should().Be(ListingStatus.Sold);
    }

    [Fact]
    public void Should_Set_ViewsCount_Property()
    {
        // Arrange
        var listing = new Listing();
        var viewsCount = _faker.Random.Int(0, 1000);

        // Act
        listing.ViewsCount = viewsCount;

        // Assert
        listing.ViewsCount.Should().Be(viewsCount);
    }
}