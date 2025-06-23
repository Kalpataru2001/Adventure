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
    public class GroupsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public GroupsController(AppDbContext context) { _context = context; }

        // DTO for creating a group
        public record CreateGroupRequest(string Name, string? Description);

        // DTO for displaying group list
        public record GroupListItemDto(Guid Id, string Name, int MemberCount);

        public record GroupMemberDto(Guid UserId, string FirstName, string LastName, string? AvatarUrl);
        public record GroupDetailDto(Guid Id, string Name, string? Description, List<GroupMemberDto> Members);
        public record AddMemberRequest(Guid UserId);
        public record AddableFriendDto(Guid Id, string FirstName, string LastName, string? AvatarUrl);

        // POST /api/groups - Create a new group
        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
        {
            var creatorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var newGroup = new Group
            {
                Name = request.Name,
                Description = request.Description,
                CreatorId = creatorId,
                CreatedAt = DateTime.UtcNow
            };

            // When creating a group, automatically add the creator as the first member.
            var firstMember = new GroupMember
            {
                Group = newGroup, // Link to the new group
                UserId = creatorId
            };

            _context.Groups.Add(newGroup);
            _context.GroupMembers.Add(firstMember);

            await _context.SaveChangesAsync();

            return Ok(newGroup);
        }

        // GET /api/groups - Get all groups the current user is a member of
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GroupListItemDto>>> GetMyGroups()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var groups = await _context.GroupMembers
                .Where(gm => gm.UserId == userId)
                .Select(gm => new GroupListItemDto(
                    gm.Group.Id,
                    gm.Group.Name,
                    gm.Group.GroupMembers.Count() // Get the total member count for the group
                ))
                .ToListAsync();

            return Ok(groups);
        }

        [HttpGet("{groupId}")]
        public async Task<ActionResult<GroupDetailDto>> GetGroupDetails(Guid groupId)
        {
            var group = await _context.Groups
                .Where(g => g.Id == groupId)
                .Select(g => new GroupDetailDto(
                    g.Id,
                    g.Name,
                    g.Description,
                    // --- THIS IS THE FIX ---
                    // We now loop through the members and for each member, we look up their profile separately.
                    g.GroupMembers.Select(gm => new GroupMemberDto(
                        gm.UserId,
                        gm.User.FirstName,
                        gm.User.LastName,
                        // This subquery finds the profile for the group member and gets their avatar URL.
                        _context.Profiles.Where(p => p.UserId == gm.UserId).Select(p => p.AvatarUrl).FirstOrDefault()
                    )).ToList()
                ))
                .FirstOrDefaultAsync();

            if (group == null)
            {
                return NotFound();
            }
            return Ok(group);
        }

        [HttpPost("{groupId}/members")]
        public async Task<IActionResult> AddMember(Guid groupId, [FromBody] AddMemberRequest request)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Authorization: Check if the current user is already a member of the group
            var isMember = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == currentUserId);
            if (!isMember)
            {
                return Forbid("You are not a member of this group and cannot add others.");
            }

            // Check if the user to be added is already a member
            var alreadyExists = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == request.UserId);
            if (alreadyExists)
            {
                return BadRequest("This user is already a member of the group.");
            }

            var newMember = new GroupMember { GroupId = groupId, UserId = request.UserId };
            _context.GroupMembers.Add(newMember);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member added successfully." });
        }
        [HttpGet("{groupId}/addable-friends")]
        public async Task<ActionResult<IEnumerable<AddableFriendDto>>> GetAddableFriends(Guid groupId)
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // 1. Get IDs of users already in the group
            var membersInGroupIds = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId)
                .Select(gm => gm.UserId)
                .ToListAsync();

            // 2. Get IDs of all of the current user's accepted friends
            var allFriendIds = await _context.Friends
                .Where(f => f.RequesterId == currentUserId && f.Status == "accepted")
                .Select(f => f.AddresseeId)
                .ToListAsync();

            // 3. Find friends who are NOT in the group already
            var addableFriendIds = allFriendIds.Except(membersInGroupIds).ToList();

            // 4. Get the details for those friends
            var addableFriends = await _context.Users
                .Where(u => addableFriendIds.Contains(u.Id))
                .Select(u => new AddableFriendDto(
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    _context.Profiles.Where(p => p.UserId == u.Id).Select(p => p.AvatarUrl).FirstOrDefault()
                ))
                .ToListAsync();

            return Ok(addableFriends);
        }

    }
}
