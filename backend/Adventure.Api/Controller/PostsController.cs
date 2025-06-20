using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Adventure.Api.Data;
using Adventure.Api.Models;
using Adventure.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Adventure.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Adventure.Api.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileService _fileService; // We'll need this for uploads
        private readonly IHubContext<NotificationHub> _notificationHubContext;

        public PostsController(AppDbContext context, IFileService fileService, IHubContext<NotificationHub> notificationHubContext)
        {
            _context = context;
            _fileService = fileService;
            _notificationHubContext = notificationHubContext;
        }

        // A DTO for how we want to return posts to the frontend
        public record PostDto(
            Guid Id,
            string PostText,
            string PhotoUrl,
            string VideoUrl,
            DateTime CreatedAt,
            Guid UserId,
            string AuthorFirstName,
            string AuthorLastName,
            string AuthorAvatarUrl,
            int LikeCount,
            int CommentCount,
            bool LikedByCurrentUser
        );

        // GET /api/posts - Get the community feed
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostDto>>> GetPosts()
        {
            var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var posts = await _context.Posts
                .AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PostDto(
                    p.Id,
                    p.PostText,
                    p.PhotoUrl,
                    p.VideoUrl,
                    p.CreatedAt,
                    p.UserId,
                    p.User.FirstName,
                    p.User.LastName,
                    _context.Profiles.Where(profile => profile.UserId == p.UserId).Select(profile => profile.AvatarUrl).FirstOrDefault(),
                    p.PostLikes.Count(),
                    p.Comments.Count(),
                    p.PostLikes.Any(l => l.UserId == currentUserId)
                ))
                .ToListAsync();

            return Ok(posts);
        }

        // POST /api/posts - Create a new post
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] string? postText, [FromForm] IFormFile? file)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (string.IsNullOrEmpty(postText) && file == null)
            {
                return BadRequest("Post must contain text or a file.");
            }

            var newPost = new Post
            {
                UserId = userId,
                PostText = postText
            };

            if (file != null)
            {
                // Re-use the avatar upload logic, but to a different bucket/folder if desired
                var fileExtension = Path.GetExtension(file.FileName);
                await using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                // Assuming you have a 'posts' bucket set up similarly to 'avatars'
                var publicUrl = await _fileService.UploadFileAsync(memoryStream, fileExtension, userId, "posts");
                newPost.PhotoUrl = publicUrl;
                if (file.ContentType.StartsWith("image/"))
                {
                    newPost.PhotoUrl = publicUrl;
                }
                else if (file.ContentType.StartsWith("video/"))
                {
                    newPost.VideoUrl = publicUrl;
                }
            }
            var currentUser = await _context.Users.FindAsync(userId);
            var friendIds = await _context.Friends
                .Where(f => f.RequesterId == userId && f.Status == "accepted")
                .Select(f => f.AddresseeId.ToString())
                .ToListAsync();

            if (friendIds.Any())
            {
                await _notificationHubContext.Clients.Users(friendIds)
                    .SendAsync("ReceiveNotification", $"{currentUser.FirstName} shared a new post.");
            }

            _context.Posts.Add(newPost);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPosts), new { id = newPost.Id }, newPost);
        }

        // POST /api/posts/{postId}/like - Like or unlike a post
        [HttpPost("{postId}/like")]
        public async Task<IActionResult> LikePost(Guid postId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var existingLike = await _context.PostLikes
                .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

            if (existingLike != null)
            {
                // User has already liked, so unlike it
                _context.PostLikes.Remove(existingLike);
            }
            else
            {
                // User has not liked yet, so add a like
                var newLike = new PostLike { PostId = postId, UserId = userId };
                _context.PostLikes.Add(newLike);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        public record CommentDto(
            Guid Id,
            string CommentText,
            DateTime CreatedAt,
             Guid UserId,
             string AuthorFirstName,
            string AuthorLastName,
             string AuthorAvatarUrl
           );
        [HttpGet("{postId}/comments")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetCommentsForPost(Guid postId)
        {
            var comments = await _context.Comments
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentDto(
                    c.Id,
                    c.CommentText,
                    c.CreatedAt,
                    c.UserId,
                    _context.Users.Where(u => u.Id == c.UserId).Select(u => u.FirstName).FirstOrDefault(),
                    _context.Users.Where(u => u.Id == c.UserId).Select(u => u.LastName).FirstOrDefault(),
                    _context.Profiles.Where(p => p.UserId == c.UserId).Select(p => p.AvatarUrl).FirstOrDefault()
                ))
                .AsNoTracking()
                .ToListAsync();

            return Ok(comments);
        }

        // A DTO for the request body to add a comment
        public record AddCommentRequest(string CommentText);

        // --- NEW ENDPOINT: Add a new comment to a post ---
        // POST /api/posts/{postId}/comments
        [HttpPost("{postId}/comments")]
        public async Task<IActionResult> AddComment(Guid postId, [FromBody] AddCommentRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (string.IsNullOrWhiteSpace(request.CommentText))
            {
                return BadRequest("Comment text cannot be empty.");
            }

            var newComment = new Comment
            {
                PostId = postId,
                UserId = userId,
                CommentText = request.CommentText,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(newComment);
            await _context.SaveChangesAsync();

            // After saving, fetch the full comment DTO to return to the client
            var createdCommentDto = await _context.Comments
                .Where(c => c.Id == newComment.Id)
                .Select(c => new CommentDto(
                    c.Id,
                    c.CommentText,
                    c.CreatedAt,
                    c.UserId,
                    _context.Users.Where(u => u.Id == c.UserId).Select(u => u.FirstName).FirstOrDefault(),
                    _context.Users.Where(u => u.Id == c.UserId).Select(u => u.LastName).FirstOrDefault(),
                    _context.Profiles.Where(p => p.UserId == c.UserId).Select(p => p.AvatarUrl).FirstOrDefault()
                ))
                .FirstAsync();

            return CreatedAtAction(nameof(GetCommentsForPost), new { postId = postId }, createdCommentDto);
        }

        public record EditPostRequest(string PostText);

        [HttpPut("{postId}")]
        public async Task<IActionResult> EditPost(Guid postId, [FromBody] EditPostRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var post = await _context.Posts.FindAsync(postId);

            if (post == null)
            {
                return NotFound();
            }

            // IMPORTANT: Authorization check
            if (post.UserId != userId)
            {
                return Forbid(); // User is not the owner of the post
            }

            post.PostText = request.PostText;
            await _context.SaveChangesAsync();

            return Ok(post); // Return the updated post
        }

        // --- NEW ENDPOINT: Delete a post ---
        // DELETE /api/posts/{postId}
        [HttpDelete("{postId}")]
        public async Task<IActionResult> DeletePost(Guid postId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var post = await _context.Posts.FindAsync(postId);

            if (post == null)
            {
                return NotFound();
            }

            // IMPORTANT: Authorization check
            if (post.UserId != userId)
            {
                return Forbid(); 
            }

            // Before deleting the post, we must also delete its file from Supabase Storage
            if (!string.IsNullOrEmpty(post.PhotoUrl) || !string.IsNullOrEmpty(post.VideoUrl))
            {
                var fileName = Path.GetFileName(new Uri(post.PhotoUrl ?? post.VideoUrl).AbsolutePath);
                // The path in the bucket is /{userId}/{fileName}
                var path = $"{userId}/{fileName}";
                await _fileService.DeleteFileAsync("posts", path); // Assumes you have a DeleteFileAsync method
            }

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return NoContent(); // 204 No Content is the standard response for a successful delete
        }


    }
}
