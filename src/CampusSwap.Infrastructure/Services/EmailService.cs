using CampusSwap.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace CampusSwap.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly ISendGridClient? _sendGridClient;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        var apiKey = _configuration["SendGrid:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _sendGridClient = new SendGridClient(apiKey);
        }
        
        _fromEmail = _configuration["SendGrid:FromEmail"] ?? "noreply@campusswap.com";
        _fromName = _configuration["SendGrid:FromName"] ?? "CampusSwap";
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        if (_sendGridClient == null)
        {
            _logger.LogWarning("SendGrid is not configured. Email to {To} with subject '{Subject}' was not sent.", to, subject);
            return;
        }

        var from = new EmailAddress(_fromEmail, _fromName);
        var toAddress = new EmailAddress(to);
        var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, body, body);
        
        try
        {
            var response = await _sendGridClient.SendEmailAsync(msg);
            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                _logger.LogError("Failed to send email to {To}. Status: {Status}", to, response.StatusCode);
            }
            else
            {
                _logger.LogInformation("Email sent successfully to {To}", to);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {To}", to);
        }
    }

    public async Task SendVerificationEmailAsync(string email, string verificationToken)
    {
        var subject = "Verify your CampusSwap account";
        var verificationUrl = $"{_configuration["AppSettings:BaseUrl"]}/verify-email?token={verificationToken}";
        
        var body = $@"
            <h2>Welcome to CampusSwap!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href='{verificationUrl}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Verify Email</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>{verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The CampusSwap Team</p>
        ";
        
        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string email, string resetToken)
    {
        var subject = "Reset your CampusSwap password";
        var resetUrl = $"{_configuration["AppSettings:BaseUrl"]}/reset-password?token={resetToken}";
        
        var body = $@"
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <p><a href='{resetUrl}' style='background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Reset Password</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>{resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The CampusSwap Team</p>
        ";
        
        await SendEmailAsync(email, subject, body);
    }
}