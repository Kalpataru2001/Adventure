using Adventure.Api.Data;
using Adventure.Api.Models;
using Adventure.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Adventure.Api.Controller;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    public record UpdateProfileRequest(string FirstName, string LastName);
    public record UpdateAvatarRequest(string AvatarUrl);
    private readonly IFileService _fileService;
    public ProfileController(AppDbContext context, IFileService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    [HttpGet]
    public async Task<ActionResult<ProfileDataDto>> GetProfileData()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId)) { return Unauthorized(); }

        var user = await _context.Users.FindAsync(userId);
        if (user == null) { return NotFound("User not found."); }

        var profile = await _context.Profiles.FindAsync(userId);
        var totalAdventures = await _context.Completions.CountAsync(c => c.UserId == userId);
        var friendsCount = await _context.Friends.CountAsync(f => f.UserId == userId);
        var currentStreak = await _context.Streaks.Where(s => s.UserId == userId).Select(s => s.CurrentStreak ?? 0).FirstOrDefaultAsync();
        var badges = await _context.UserBadges.Where(ub => ub.UserId == userId).Join(_context.Badges, ub => ub.BadgeId, b => b.Id, (ub, b) => new BadgeDto { Name = b.Name, IconUrl = b.IconUrl }).ToListAsync();

        var profileData = new ProfileDataDto
        {
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = profile?.AvatarUrl, // Get avatar from profile
            MemberSince = user.CreatedAt,
            Level = (totalAdventures / 5) + 1,
            Stats = new ProfileStatsDto { TotalAdventures = totalAdventures, FriendsCount = friendsCount, CurrentStreak = currentStreak },
            Badges = badges
        };

        return Ok(profileData);
    }


    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId)) { return Unauthorized(); }
        var user = await _context.Users.FindAsync(userId);
        if (user == null) { return NotFound("User not found."); }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    

    [HttpPut("avatar")]
    public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarRequest request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId)) { return Unauthorized(); }

        var profile = await _context.Profiles.FindAsync(userId);
        if (profile == null)
        {
            profile = new Profile { UserId = userId };
            _context.Profiles.Add(profile);
        }

        profile.AvatarUrl = request.AvatarUrl;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId)) { return Unauthorized(); }

        if (file == null || file.Length == 0) { return BadRequest("No file uploaded."); }

        // Upload the file to Supabase Storage
        var fileExtension = Path.GetExtension(file.FileName);
        await using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        memoryStream.Position = 0;
        var publicUrl = await _fileService.UploadFileAsync(memoryStream, fileExtension, userId, "avatars");

        // Save the public URL to the user's profile in the database
        var profile = await _context.Profiles.FindAsync(userId);
        if (profile == null)
        {
            profile = new Profile { UserId = userId };
            _context.Profiles.Add(profile);
        }
        profile.AvatarUrl = publicUrl;
        await _context.SaveChangesAsync();

        // Return the new URL so the frontend can update immediately
        return Ok(new { avatarUrl = publicUrl });
    }
}