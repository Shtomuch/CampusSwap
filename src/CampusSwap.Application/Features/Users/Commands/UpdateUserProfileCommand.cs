using CampusSwap.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Application.Features.Users.Commands;

public class UpdateUserProfileCommand : IRequest
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserProfileCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        Console.WriteLine($"[UpdateUserProfileCommand] Оновлення профілю для користувача {request.UserId}");
        Console.WriteLine($"[UpdateUserProfileCommand] Дані: FirstName={request.FirstName}, LastName={request.LastName}, PhoneNumber={request.PhoneNumber}");

        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == Guid.Parse(request.UserId), cancellationToken);

            if (user == null)
            {
                Console.WriteLine($"[UpdateUserProfileCommand] ❌ Користувач {request.UserId} не знайдений");
                throw new KeyNotFoundException($"User with ID {request.UserId} not found.");
            }

            Console.WriteLine($"[UpdateUserProfileCommand] ✅ Користувач знайдений: {user.Email}");

            // Оновлюємо дані користувача
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            Console.WriteLine($"[UpdateUserProfileCommand] 📝 Дані оновлено, зберігаємо...");

            await _context.SaveChangesAsync(cancellationToken);

            Console.WriteLine($"[UpdateUserProfileCommand] ✅ Профіль користувача {request.UserId} успішно оновлено");
            Console.WriteLine($"[UpdateUserProfileCommand] 📝 Нові дані: {user.FullName}, Phone: {user.PhoneNumber}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UpdateUserProfileCommand] ❌ Помилка: {ex.Message}");
            Console.WriteLine($"[UpdateUserProfileCommand] ❌ Stack trace: {ex.StackTrace}");
            throw;
        }
    }
}
