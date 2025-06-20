using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Adventure.Api.Data;
using Adventure.Api.Models;
using Adventure.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace Adventure.Api.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;

        public BookingsController(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        // A DTO for the data we send to the bookings page
        public record ActiveChallengeDto(
            Guid CompletionId,
            Guid ChallengeId,
            string Title,
            string Description,
            string Category,
            int Difficulty
        );

        // GET /api/bookings/my-challenges
        [HttpGet("my-challenges")]
        public async Task<ActionResult<IEnumerable<ActiveChallengeDto>>> GetMyActiveChallenges()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var activeChallenges = await _context.Completions
                .Where(c => c.UserId == userId && c.CompletedAt == null) // The key filter!
                .Join(_context.Challenges,
                    completion => completion.ChallengeId,
                    challenge => challenge.Id,
                    (completion, challenge) => new ActiveChallengeDto(
                        completion.Id,
                        challenge.Id,
                        challenge.Title,
                        challenge.Description,
                        challenge.Category,
                        challenge.Difficulty ?? 0
                    ))
                .ToListAsync();

            return Ok(activeChallenges);
        }

        // POST /api/bookings/{completionId}/complete
        [HttpPost("{completionId}/complete")]
        public async Task<IActionResult> CompleteChallenge(Guid completionId, [FromForm] string? postText, [FromForm] IFormFile? file)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var completion = await _context.Completions
                .FirstOrDefaultAsync(c => c.Id == completionId && c.UserId == userId);

            if (completion == null)
            {
                return NotFound("Active challenge not found.");
            }

            if (file == null)
            {
                return BadRequest("A photo or video is required to complete a challenge.");
            }

            // 1. Upload the file
            var fileExtension = Path.GetExtension(file.FileName);
            await using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;
            var publicUrl = await _fileService.UploadFileAsync(memoryStream, fileExtension, userId, "avatars");

            // 2. Mark the challenge as complete
            completion.CompletedAt = DateTime.UtcNow;
            if (file.ContentType.StartsWith("image/")) { completion.PhotoUrl = publicUrl; }
            else if (file.ContentType.StartsWith("video/")) { completion.VideoUrl = publicUrl; }

            // 3. Create a new social media post
            var newPost = new Post
            {
                UserId = userId,
                CompletionId = completionId,
                PostText = postText,
                PhotoUrl = completion.PhotoUrl,
                VideoUrl = completion.VideoUrl
            };
            _context.Posts.Add(newPost);

            // 4. Save everything to the database
            await _context.SaveChangesAsync();

            return Ok(new { message = "Adventure completed and shared!" });
        }
    }
}
