using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Adventure.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Adventure.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Adventure.Api.Hubs;

namespace Adventure.Api.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FriendsController : ControllerBase
    {

        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _notificationHubContext;
        private readonly ILogger<FriendsController> _logger;
        public FriendsController(AppDbContext context,
             IHubContext<NotificationHub> notificationHubContext,
            ILogger<FriendsController> logger)
             { 
            _context = context;
            _notificationHubContext = notificationHubContext;
            _logger = logger;
        }

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

            // Fetch the requester's details from the database to get their name reliably.
            var requester = await _context.Users.FindAsync(requesterId);
            if (requester == null) return Unauthorized();

            var existing = await _context.Friends.FindAsync(requesterId, addresseeId);
            if (existing != null) return BadRequest("A request has already been sent or a relationship exists.");

            var newRequest = new Friend { RequesterId = requesterId, AddresseeId = addresseeId, Status = "pending", CreatedAt = DateTime.UtcNow, ModifiedAt = DateTime.UtcNow };
            _context.Friends.Add(newRequest);

            // Use the fetched name to create the dynamic message.
            var notificationMessage = $"{requester.FirstName} sent you a friend request.";
            var notification = new Notification
            {
                UserId = addresseeId,
                ActorUserId = requesterId,
                Type = "friend_request_received",
                Message = notificationMessage,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Push the notification via SignalR.
            await _notificationHubContext.Clients.User(addresseeId.ToString())
                .SendAsync("ReceiveNotification", notificationMessage);

            return Ok(new { message = "Friend request sent." });
        }

        [HttpPut("accept/{requesterId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid requesterId)
        {
            // 1. Get the ID of the current user who is accepting the request.
            var addresseeId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // 2. --- THIS IS THE FIX ---
            // Fetch the user's details directly from the database to get their name reliably.
            var addressee = await _context.Users.FindAsync(addresseeId);
            if (addressee == null)
            {
                // This is a safety check; it should not happen for a logged-in user.
                return Unauthorized("Could not identify the user accepting the request.");
            }
            // We now have the correct name in the 'addressee.FirstName' variable.

            // 3. Find the original pending friend request.
            var request = await _context.Friends.FindAsync(requesterId, addresseeId);
            if (request == null || request.Status != "pending")
            {
                return NotFound("Request not found or has already been handled.");
            }

            // 4. Update the original request status to "accepted".
            request.Status = "accepted";
            request.ModifiedAt = DateTime.UtcNow;

            // 5. Create the reverse relationship to make the friendship two-way.
            var inverseFriendship = new Friend
            {
                RequesterId = addresseeId,
                AddresseeId = requesterId,
                Status = "accepted",
                CreatedAt = DateTime.UtcNow,
                ModifiedAt = DateTime.UtcNow
            };
            _context.Friends.Add(inverseFriendship);

            // 6. Create the notification using the name we fetched from the database.
            var notificationMessage = $"{addressee.FirstName} accepted your friend request.";

            var notification = new Notification
            {
                UserId = requesterId,           // The user to notify (the one who sent the request).
                ActorUserId = addresseeId,      // The user who performed the action.
                Type = "friend_request_accepted",
                Message = notificationMessage,  // Use the full, dynamic message.
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            // 7. Save all changes (friendship updates and the new notification) to the database.
            await _context.SaveChangesAsync();

            // 8. Push the real-time notification to the original sender.
            await _notificationHubContext.Clients.User(requesterId.ToString())
                .SendAsync("ReceiveNotification", notificationMessage);

            return Ok(new { message = "Friend request accepted." });
        }


        [HttpPut("decline/{otherUserId}")]
        public async Task<IActionResult> DeclineOrCancelRequest(Guid otherUserId)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Fetch the current user's details to get their name for the notification.
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null) return Unauthorized();

            // Find the request, regardless of who sent it.
            var request = await _context.Friends
                .FirstOrDefaultAsync(f => (f.RequesterId == currentUserId && f.AddresseeId == otherUserId) ||
                                          (f.RequesterId == otherUserId && f.AddresseeId == currentUserId));

            if (request == null || request.Status != "pending") return NotFound("Request not found.");

            // Determine who needs to be notified.
            bool wasICancelling = request.RequesterId == currentUserId;
            var userToNotifyId = wasICancelling ? request.AddresseeId : request.RequesterId;
            var notificationMessage = wasICancelling
                ? $"{currentUser.FirstName} cancelled their friend request."
                : $"{currentUser.FirstName} declined your friend request.";

            // Remove the pending request from the database.
            _context.Friends.Remove(request);

            // Create the notification for the other user.
            var notification = new Notification
            {
                UserId = userToNotifyId,
                ActorUserId = currentUserId,
                Type = wasICancelling ? "friend_request_cancelled" : "friend_request_declined",
                Message = notificationMessage,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Push the real-time notification.
            await _notificationHubContext.Clients.User(userToNotifyId.ToString())
                .SendAsync("ReceiveNotification", notificationMessage);

            return Ok(new { message = "Request handled." });
        }


        [HttpDelete("{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid friendId)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Fetch the current user's details for the notification message.
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null) return Unauthorized();

            // A friendship is a two-way street, so we must find and delete both rows.
            var friendship1 = await _context.Friends.FindAsync(currentUserId, friendId);
            var friendship2 = await _context.Friends.FindAsync(friendId, currentUserId);

            if (friendship1 == null || friendship2 == null)
            {
                return NotFound("Friendship not found.");
            }

            _context.Friends.Remove(friendship1);
            _context.Friends.Remove(friendship2);

            // Create a notification for the user who was removed as a friend.
            var notificationMessage = $"{currentUser.FirstName} removed you as a friend.";
            var notification = new Notification
            {
                UserId = friendId, // Notify the user who was removed.
                ActorUserId = currentUserId,
                Type = "friend_removed",
                Message = notificationMessage,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Push the real-time notification.
            await _notificationHubContext.Clients.User(friendId.ToString())
                .SendAsync("ReceiveNotification", notificationMessage);

            return NoContent();
        }
    }
}
