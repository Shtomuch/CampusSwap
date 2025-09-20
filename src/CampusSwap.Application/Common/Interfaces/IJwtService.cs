using CampusSwap.Domain.Entities;

namespace CampusSwap.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    (string AccessToken, string RefreshToken) GenerateTokens(User user);
    bool ValidateToken(string token);
    string? GetUserIdFromToken(string token);
}