using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Adventure.Api.Data;
using Adventure.Api.Models; // Your DTOs are here
using Microsoft.AspNetCore.Authorization;

namespace Adventure.Api.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("map-data")]
        public async Task<ActionResult<IEnumerable<MapPinDto>>> GetMapData()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var mapPins = await _context.Completions
                .Where(c => c.UserId == userId && c.CompletedAt != null) // Only completed challenges
                .Include(c => c.Challenge) // IMPORTANT: Include the related challenge data
                .Where(c => c.Challenge.Latitude != null && c.Challenge.Longitude != null) // Only get challenges with coordinates
                .Select(c => new MapPinDto
                {
                    Title = c.Challenge.Title,
                    Latitude = c.Challenge.Latitude.Value,
                    Longitude = c.Challenge.Longitude.Value
                })
                .ToListAsync();

            return Ok(mapPins);
        }
    }
}
