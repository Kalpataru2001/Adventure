using SendGrid;
using SendGrid.Helpers.Mail;

namespace Adventure.Api.Services;

public class SendGridEmailService : IEmailService
{
    private readonly ILogger<SendGridEmailService> _logger;
    private readonly IConfiguration _config;

    public SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    // Updated implementation to send the OTP
    public async Task SendPasswordResetOtpAsync(string toEmail, string otp)
    {
        var apiKey = _config["SendGrid:ApiKey"];
        var fromEmail = _config["SendGrid:FromEmail"];
        var fromName = _config["SendGrid:FromName"];

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("SendGrid API Key is not configured.");
            return;
        }

        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(fromEmail, fromName);
        var to = new EmailAddress(toEmail);
        var subject = "Your Adventure App Password Reset Code";
        var plainTextContent = $"Your password reset code is: {otp}. It is valid for 10 minutes.";
        var htmlContent = $"<p>Hi there,</p><p>Your password reset code is: <strong>{otp}</strong></p><p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p><p>Thanks,<br/>The Adventure App Team</p>";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
        var response = await client.SendEmailAsync(msg);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Failed to send OTP email. Status Code: {StatusCode}, Body: {Body}",
                response.StatusCode,
                await response.Body.ReadAsStringAsync());
        }
    }
}