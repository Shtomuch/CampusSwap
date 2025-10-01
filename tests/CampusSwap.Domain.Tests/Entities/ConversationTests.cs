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
        var user1Id = Guid.NewGuid();
        var user2Id = Guid.NewGuid();

        // Act
        var conversation = new Conversation
        {
            Id = id,
            User1Id = user1Id,
            User2Id = user2Id
        };

        // Assert
        conversation.Id.Should().Be(id);
        conversation.User1Id.Should().Be(user1Id);
        conversation.User2Id.Should().Be(user2Id);
        conversation.Messages.Should().NotBeNull().And.BeEmpty();
        conversation.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Should_Have_Collections_Initialized()
    {
        // Act
        var conversation = new Conversation();

        // Assert
        conversation.Messages.Should().NotBeNull();
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
    public void Should_Set_IsActive()
    {
        // Arrange
        var conversation = new Conversation();

        // Act
        conversation.IsActive = false;

        // Assert
        conversation.IsActive.Should().BeFalse();
    }
}