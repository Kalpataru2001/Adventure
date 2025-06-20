using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Adventure.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Adventure.Api.Models;

namespace Adventure.Api.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FriendsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FriendsController(AppDbContext context) { _context = context; }

        public record UserDto(Guid Id, string FirstName, string LastName, string? AvatarUrl);
        public record FriendRequestDto(Guid RequesterId, string FirstName, string LastName, string? AvatarUrl);

        [HttpGet("find")]
        public async Task<ActionResult<IEnumerable<UserDto>>> FindNewFriends()
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var existingRelations = await _context.Friends
                .Where(f => f.RequesterId == currentUserId || f.AddresseeId == currentUserId)
                .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
                .Distinct()
                .ToListAsync();

            existingRelations.Add(currentUserId);

            var usersToDisplay = await _context.Users
                .Where(u => !existingRelations.Contains(u.Id))
                // --- THIS IS THE FIX ---
                // We now explicitly query the Profiles table for the avatar url.
                .Select(u => new UserDto(
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    _context.Profiles.Where(p => p.UserId == u.Id).Select(p => p.AvatarUrl).FirstOrDefault()
                ))
                .ToListAsync();

            return Ok(usersToDisplay);
        }

        [HttpGet("requests/incoming")]
        public async Task<ActionResult<IEnumerable<FriendRequestDto>>> GetIncomingRequests()
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var requests = await _context.Friends
                .Where(f => f.AddresseeId == currentUserId && f.Status == "pending")
                // --- THIS IS THE FIX ---
                // We select the user info and then explicitly query for the avatar url.
                .Select(f => new FriendRequestDto(
                    f.RequesterId,
                    f.Requester.FirstName,
                    f.Requester.LastName,
                    _context.Profiles.Where(p => p.UserId == f.RequesterId).Select(p => p.AvatarUrl).FirstOrDefault()
                ))
                .ToListAsync();

            return Ok(requests);
        }

        // --- All other methods (SendFriendRequest, AcceptFriendRequest, etc.) are correct ---
        // --- and do not need to be changed. I am including them for completeness. ---

        [HttpPost("request/{addresseeId}")]
        public async Task<IActionResult> SendFriendRequest(Guid addresseeId)
        {
            var requesterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (requesterId == addresseeId) return BadRequest("You cannot send a friend request to yourself.");

            var existing = await _context.Friends.FindAsync(requesterId, addresseeId);
            if (existing != null) return BadRequest("A request has already been sent.");

            var newRequest = new Friend { RequesterId = requesterId, AddresseeId = addresseeId, Status = "pending", CreatedAt = DateTime.UtcNow, ModifiedAt = DateTime.UtcNow };
            _context.Friends.Add(newRequest);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Friend request sent." });
        }

        [HttpPut("accept/{requesterId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid requesterId)
        {
            var addresseeId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var request = await _context.Friends.FindAsync(requesterId, addresseeId);
            if (request == null || request.Status != "pending") return NotFound("Request not found or already handled.");

            request.Status = "accepted";
            request.ModifiedAt = DateTime.UtcNow;

            var inverseFriendship = new Friend { RequesterId = addresseeId, AddresseeId = requesterId, Status = "accepted", CreatedAt = DateTime.UtcNow, ModifiedAt = DateTime.UtcNow };
            _context.Friends.Add(inverseFriendship);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Friend request accepted." });
        }

        [HttpPut("decline/{otherUserId}")]
        public async Task<IActionResult> DeclineOrCancelRequest(Guid otherUserId)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var request = await _context.Friends
                .FirstOrDefaultAsync(f => (f.RequesterId == currentUserId && f.AddresseeId == otherUserId) ||
                                          (f.RequesterId == otherUserId && f.AddresseeId == currentUserId));

            if (request == null || request.Status != "pending") return NotFound("Request not found.");

            _context.Friends.Remove(request);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Request declined." });
        }

        [HttpDelete("{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid friendId)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var friendship1 = await _context.Friends.FindAsync(currentUserId, friendId);
            var friendship2 = await _context.Friends.FindAsync(friendId, currentUserId);

            if (friendship1 != null) _context.Friends.Remove(friendship1);
            if (friendship2 != null) _context.Friends.Remove(friendship2);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
