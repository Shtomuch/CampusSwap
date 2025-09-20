namespace CampusSwap.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendVerificationEmailAsync(string email, string verificationToken);
    Task SendPasswordResetEmailAsync(string email, string resetToken);
}