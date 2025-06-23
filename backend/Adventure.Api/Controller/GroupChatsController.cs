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
    public class GroupChatsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService;
        public GroupChatsController(AppDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public record ChatMessageDto(Guid Id, string? MessageText, string? MediaUrl, DateTime CreatedAt, Guid UserId, string AuthorFirstName, string? AuthorAvatarUrl);

        // GET /api/group-chats/{groupId}
        //[HttpGet("{groupId}")]
        //public async Task<ActionResult<IEnumerable<ChatMessageDto>>> GetChatMessages(Guid groupId)
        //{
        //    var messages = await _context.GroupChats
        //        .Where(c => c.GroupId == groupId)
        //        .OrderBy(c => c.CreatedAt)
        //        .Take(50) // Get the latest 50 messages
        //        .Select(c => new ChatMessageDto(
        //            c.Id, c.MessageText, c.MediaUrl, c.CreatedAt, c.UserId,
        //            _context.Users.Where(u => u.Id == c.UserId).Select(u => u.FirstName).FirstOrDefault(),
        //            _context.Profiles.Where(p => p.UserId == c.UserId).Select(p => p.AvatarUrl).FirstOrDefault()
        //        ))
        //        .ToListAsync();

        //    return Ok(messages);
        //}

        // POST /api/group-chats/{groupId}/media
        [HttpPost("{groupId}/media")]
        public async Task<IActionResult> UploadChatMedia(Guid groupId, IFormFile file)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            // Authorization: You'd want to check if the user is in the group first.

            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var fileExtension = Path.GetExtension(file.FileName);
            await using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            // Upload to a new "chat-media" bucket
            var publicUrl = await _fileService.UploadFileAsync(memoryStream, fileExtension, userId, "chat-media");

            return Ok(new { mediaUrl = publicUrl });
        }
    }
}
