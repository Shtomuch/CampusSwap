using Bogus;
using CampusSwap.Domain.Entities;
using FluentAssertions;

namespace CampusSwap.Domain.Tests.Entities;

public class MessageTests
{
    private readonly Faker _faker = new();

    [Fact]
    public void Constructor_Should_Initialize_Properties_Correctly()
    {
        // Arrange
        var id = Guid.NewGuid();
        var conversationId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var content = _faker.Lorem.Paragraph();

        // Act
        var message = new ChatMessage
        {
            Id = id,
            ConversationId = conversationId,
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content
        };

        // Assert
        message.Id.Should().Be(id);
        message.ConversationId.Should().Be(conversationId);
        message.SenderId.Should().Be(senderId);
        message.ReceiverId.Should().Be(receiverId);
        message.Content.Should().Be(content);
        message.IsRead.Should().BeFalse();
        message.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Mark_Message_As_Read()
    {
        // Arrange
        var message = new ChatMessage();

        // Act
        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;

        // Assert
        message.IsRead.Should().BeTrue();
        message.ReadAt.Should().NotBeNull();
        message.ReadAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Have_Default_IsRead_As_False()
    {
        // Act
        var message = new ChatMessage();

        // Assert
        message.IsRead.Should().BeFalse();
    }

    [Fact]
    public void Should_Have_CreatedAt_Set_On_Creation()
    {
        // Act
        var message = new ChatMessage();

        // Assert
        message.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Should_Have_Null_ReadAt_By_Default()
    {
        // Act
        var message = new ChatMessage();

        // Assert
        message.ReadAt.Should().BeNull();
    }
}