using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Application.Features.Users.Queries;
using CampusSwap.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CampusSwap.Application.Features.Auth.Commands;

public class RegisterCommand : IRequest<AuthResponse>
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Faculty { get; set; } = string.Empty;
    public int YearOfStudy { get; set; }
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one number");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.StudentId)
            .NotEmpty().WithMessage("Student ID is required");

        RuleFor(x => x.University)
            .NotEmpty().WithMessage("University is required");

        RuleFor(x => x.YearOfStudy)
            .InclusiveBetween(1, 7).WithMessage("Year of study must be between 1 and 7");
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;

    public RegisterCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        IEmailService emailService)
    {
        _context = context;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<AuthResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser != null)
            throw new InvalidOperationException("User with this email already exists");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            StudentId = request.StudentId,
            University = request.University,
            Faculty = request.Faculty,
            YearOfStudy = request.YearOfStudy,
            IsActive = true
        };

        var (accessToken, refreshToken) = _jwtService.GenerateTokens(user);
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendVerificationEmailAsync(user.Email, Guid.NewGuid().ToString());

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                University = user.University,
                IsEmailVerified = user.IsEmailVerified
            }
        };
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        byte[] hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}