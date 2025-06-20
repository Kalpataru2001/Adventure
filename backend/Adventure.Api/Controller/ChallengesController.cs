using Adventure.Api.Data;
using Adventure.Api.Models;
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Adventure.Api.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChallengesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public record AcceptChallengeRequest(Guid ChallengeId);
        public ChallengesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous] // <-- 2. ADD THIS ATTRIBUTE
        public async Task<ActionResult<IEnumerable<Challenge>>> GetChallenges()
        {
            var challenges = await _context.Challenges.ToListAsync();
            return Ok(challenges);
        }

        // EXAMPLE: If you add an endpoint to create a challenge later,
        // it would be protected by default. You could also be explicit.
        /*
        [HttpPost]
        [Authorize] // This endpoint would require a valid login token
        public async Task<IActionResult> CreateChallenge(Challenge newChallenge)
        {
            // ... logic to create challenge
            return Ok();
        }
        */

        [HttpPost("accept")]
        [Authorize] 
        public async Task<IActionResult> AcceptChallenge([FromBody] AcceptChallengeRequest request)
        {
            // Get the logged-in user's ID from the JWT token.
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized();
            }

            // Check if the user has already accepted this challenge.
            var alreadyAccepted = await _context.Completions
                .AnyAsync(c => c.UserId == userId && c.ChallengeId == request.ChallengeId);

            if (alreadyAccepted)
            {
                return Ok(new { message = "Challenge already accepted." });
            }

            // Create a new completion record.
            var newCompletion = new Completion
            {
                UserId = userId,
                ChallengeId = request.ChallengeId
            };

            _context.Completions.Add(newCompletion);
            await _context.SaveChangesAsync();

            return Ok(newCompletion); // Return the created record.
        }

        // GET /api/challenges/my-completions
        // Gets all challenge IDs the current user has accepted.
        [HttpGet("my-completions")]
        [Authorize] // This action also REQUIRES a logged-in user.
        public async Task<ActionResult<IEnumerable<Guid>>> GetMyCompletions()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized();
            }

            var myCompletionIds = await _context.Completions
                .Where(c => c.UserId == userId)
                .Select(c => c.ChallengeId)
                .ToListAsync();

            return Ok(myCompletionIds);
        }
    }
}