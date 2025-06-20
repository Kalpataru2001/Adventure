using System.ComponentModel.DataAnnotations;
namespace Adventure.Api.Models
{
    public record RegisterRequest([Required] string FirstName, [Required] string LastName, [Required][EmailAddress] string Email, [Required] string Password, [Required] DateTime Dob);

    // Matches the Angular LoginRequest
    public record LoginRequest([Required][EmailAddress] string Email, [Required] string Password);

    // For handling the Google ID token from the frontend
    public record GoogleLoginRequest([Required] string IdToken);

    // Matches the Angular AuthResponse
    public record AuthResponse(string Token, string Email, string FirstName, string LastName);
    
    // For the /me endpoint
    public record UserProfileResponse(string Email, string FirstName, string LastName);

    public record ForgotPasswordRequest([Required][EmailAddress] string Email);
    public record VerifyOtpRequest([Required][EmailAddress] string Email, [Required] string Otp);
    public record ResetPasswordRequest([Required][EmailAddress] string Email, [Required] string Otp, [Required] string Password);
}
