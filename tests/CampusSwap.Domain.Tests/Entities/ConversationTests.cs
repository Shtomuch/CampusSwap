using Bogus;
using CampusSwap.Domain.Entities;
using FluentAssertions;

namespace CampusSwap.Domain.Tests.Entities;

public class ConversationTests
{
    private readonly Faker _faker = new();

    [Fact]
    public void Constructor_Should_Initialize_Properties_Correctly()
    {
        // Arrange
        var id = Guid.NewGuid();
        var listingId = Guid.NewGuid();
        var title = _faker.Lorem.Sentence();

        // Act
        var conversation = new Conversation
        {
            Id = id,
            ListingId = listingId,
            Title = title
        };

        // Assert
        conversation.Id.Should().Be(id);
        conversation.ListingId.Should().Be(listingId);
        conversation.Title.Should().Be(title);
        conversation.Messages.Should().NotBeNull().And.BeEmpty();
        conversation.UserConversations.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Should_Have_Collections_Initialized()
    {
        // Act
        var conversation = new Conversation();

        // Assert
        conversation.Messages.Should().NotBeNull();
        conversation.UserConversations.Should().NotBeNull();
    }

    [Fact]
    public void Should_Set_CreatedAt_On_Creation()
    {
        // Act
        var conversation = new Conversation();

        // Assert
        conversation.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Set_LastMessageAt()
    {
        // Arrange
        var conversation = new Conversation();
        var lastMessageTime = _faker.Date.Recent();

        // Act
        conversation.LastMessageAt = lastMessageTime;

        // Assert
        conversation.LastMessageAt.Should().Be(lastMessageTime);
    }

    [Fact]
    public void Should_Set_Title()
    {
        // Arrange
        var conversation = new Conversation();
        var title = _faker.Lorem.Sentence();

        // Act
        conversation.Title = title;

        // Assert
        conversation.Title.Should().Be(title);
    }
}