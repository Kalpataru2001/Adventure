// Path: Controller/AuthController.cs
using System.Security.Claims;
using Adventure.Api.Data;
using Adventure.Api.Models;
using Adventure.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;
// We won't even need 'using BCrypt.Net;' with this method.

namespace Adventure.Api.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, ITokenService tokenService, IConfiguration config, IEmailService emailService)
        {
            _context = context;
            _tokenService = tokenService;
            _config = config;
            _emailService = emailService;
        }

        // ... inside the AuthController class ...

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email is already in use." });
            }

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),

                // --- THIS IS THE FIX ---
                // Ensure the Date of Birth is treated as a UTC date.
                // For a date-only field, this effectively removes the ambiguous time part.
                Dob = DateTime.SpecifyKind(request.Dob, DateTimeKind.Utc),

                // It's also good practice to ensure CreatedAt is explicitly UTC.
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            // The error was happening on this line. It will now succeed.
            await _context.SaveChangesAsync();

            var token = _tokenService.CreateToken(user);
            return Ok(new AuthResponse(token, user.Email, user.FirstName, user.LastName));
        }

        // ... rest of the file ...

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var token = _tokenService.CreateToken(user);
            return Ok(new AuthResponse(token, user.Email, user.FirstName, user.LastName));
        }

        // ... (The rest of the file remains the same)
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            // ... code for google login
            try
            {
                var validationSettings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _config["Google:ClientId"] }
                };
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, validationSettings);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
                if (user == null)
                {
                    user = new User
                    {
                        Email = payload.Email,
                        FirstName = payload.GivenName,
                        LastName = payload.FamilyName,
                        GoogleId = payload.Subject,
                        Dob = new DateTime(1900, 1, 1),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                }
                else
                {
                    user.GoogleId ??= payload.Subject;
                }
                await _context.SaveChangesAsync();
                var token = _tokenService.CreateToken(user);
                return Ok(new AuthResponse(token, user.Email, user.FirstName, user.LastName));
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { message = "Invalid Google token." });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserProfileResponse>> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();
            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound();
            return Ok(new UserProfileResponse(user.Email, user.FirstName, user.LastName));
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return Ok(new { message = "If an account with this email exists, a password reset code has been sent." });
            }

            // Generate a 6-digit OTP
            var otp = new Random().Next(100000, 999999).ToString();

            // IMPORTANT: Store a HASH of the OTP, not the plain text OTP.
            // This is for security. We'll use the same BCrypt library.
            user.PasswordResetToken = BCrypt.Net.BCrypt.HashPassword(otp);
            user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(10); // OTP is valid for 10 minutes

            await _context.SaveChangesAsync();
            await _emailService.SendPasswordResetOtpAsync(user.Email, otp); // Send the PLAIN OTP via email

            return Ok(new { message = "If an account with this email exists, a password reset code has been sent." });
        }
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp(VerifyOtpRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || user.PasswordResetToken == null || user.ResetTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Invalid request or OTP has expired." });
            }

            // Verify the provided OTP against the stored hash
            bool isOtpValid = BCrypt.Net.BCrypt.Verify(request.Otp, user.PasswordResetToken);

            if (!isOtpValid)
            {
                return BadRequest(new { message = "Invalid OTP." });
            }

            return Ok(new { message = "OTP verified successfully." });
        }


        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || user.PasswordResetToken == null || user.ResetTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Invalid request or OTP session has expired. Please try again." });
            }

            // Re-verify the OTP as a final security check
            bool isOtpValid = BCrypt.Net.BCrypt.Verify(request.Otp, user.PasswordResetToken);
            if (!isOtpValid)
            {
                return BadRequest(new { message = "Invalid OTP." });
            }

            // If OTP is valid, reset the password and clear the token fields
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully." });
        }

    }
}