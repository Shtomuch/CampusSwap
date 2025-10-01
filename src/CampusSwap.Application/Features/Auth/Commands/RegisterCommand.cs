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
            .NotEmpty().WithMessage("Email обов'язковий")
            .EmailAddress().WithMessage("Невірний формат email");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Пароль обов'язковий")
            .MinimumLength(8).WithMessage("Пароль має бути щонайменше 8 символів")
            .Matches(@"[A-Z]").WithMessage("Пароль має містити хоча б одну велику літеру")
            .Matches(@"[a-z]").WithMessage("Пароль має містити хоча б одну малу літеру")
            .Matches(@"[0-9]").WithMessage("Пароль має містити хоча б одну цифру");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ім'я обов'язкове")
            .MaximumLength(100).WithMessage("Ім'я не має перевищувати 100 символів");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Прізвище обов'язкове")
            .MaximumLength(100).WithMessage("Прізвище не має перевищувати 100 символів");

        RuleFor(x => x.StudentId)
            .NotEmpty().WithMessage("Номер студентського обов'язковий");

        RuleFor(x => x.University)
            .NotEmpty().WithMessage("Університет обов'язковий");

        RuleFor(x => x.YearOfStudy)
            .InclusiveBetween(1, 7).WithMessage("Курс має бути від 1 до 7");
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
            throw new InvalidOperationException("Користувач з таким email вже існує");

        var existingStudent = await _context.Users
            .FirstOrDefaultAsync(u => u.StudentId == request.StudentId, cancellationToken);
        if (existingStudent != null)
            throw new InvalidOperationException("Студентський квиток вже зареєстрований");

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var existingPhone = await _context.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber, cancellationToken);
            if (existingPhone != null)
                throw new InvalidOperationException("Номер телефону вже використовується");
        }

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
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
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
                PhoneNumber = user.PhoneNumber,
                StudentId = user.StudentId,
                University = user.University,
                Faculty = user.Faculty,
                YearOfStudy = user.YearOfStudy,
                ProfileImageUrl = user.ProfileImageUrl,
                Rating = user.Rating,
                ReviewsCount = user.ReviewsCount,
                IsEmailVerified = user.IsEmailVerified,
                IsPhoneVerified = user.IsPhoneVerified,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
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