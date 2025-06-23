using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Adventure.Api.Data;
using Adventure.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace Adventure.Api.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class StreaksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StreaksController(AppDbContext context)
        {
            _context = context;
        }

        // This endpoint should be called by the frontend every time a challenge is completed.
        [HttpPost("update")]
        public async Task<IActionResult> UpdateStreak()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.UserId == userId);

            // If user has no streak record yet, create one.
            if (streak == null)
            {
                streak = new Streak { UserId = userId, CurrentStreak = 1, StartDate = DateTime.UtcNow.Date, EndDate = DateTime.UtcNow.Date };
                _context.Streaks.Add(streak);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Streak started!", newStreak = streak.CurrentStreak });
            }

            // Check if the user already completed a challenge today.
            if (streak.EndDate == DateTime.UtcNow.Date)
            {
                return Ok(new { message = "Streak already updated for today.", currentStreak = streak.CurrentStreak });
            }

            // Check if the last completion was yesterday to continue the streak.
            if (streak.EndDate == DateTime.UtcNow.Date.AddDays(-1))
            {
                streak.CurrentStreak = (streak.CurrentStreak ?? 0) + 1;
                streak.EndDate = DateTime.UtcNow.Date;
            }
            else // The streak was broken.
            {
                streak.CurrentStreak = 1; // Start a new streak
                streak.StartDate = DateTime.UtcNow.Date;
                streak.EndDate = DateTime.UtcNow.Date;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Streak updated.", newStreak = streak.CurrentStreak });
        }
    }
}
