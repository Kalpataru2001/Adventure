namespace Adventure.Api.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetOtpAsync(string toEmail, string otp);
    }
}
