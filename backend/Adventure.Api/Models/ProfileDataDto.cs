namespace Adventure.Api.Models
{
    public class ProfileDataDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime MemberSince { get; set; }
        public string? AvatarUrl { get; set; }
        public int Level { get; set; }
        public ProfileStatsDto Stats { get; set; }
        public List<BadgeDto> Badges { get; set; }
    }

    public class ProfileStatsDto
    {
        public int TotalAdventures { get; set; }
        public int CurrentStreak { get; set; }
        public int FriendsCount { get; set; }
        // You can add more stats here later
    }

    public class BadgeDto
    {
        public string Name { get; set; }
        public string IconUrl { get; set; } // We'll use the emoji from the DB
    }

    public class Profile
    {
        public Guid UserId { get; set; } // This is the Primary Key
        public string? Name { get; set; }
        public string? AvatarUrl { get; set; } // <-- ADDED: For the user's avatar
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Interests { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class Friend
    {
        // Corresponds to the 'requester_id' column
        public Guid RequesterId { get; set; }

        // Corresponds to the 'addressee_id' column
        public Guid AddresseeId { get; set; }

        // Corresponds to the 'status' column
        public string Status { get; set; }

        // Corresponds to the 'created_at' column
        public DateTime CreatedAt { get; set; }

        // Corresponds to the 'modified_at' column
        public DateTime ModifiedAt { get; set; }

        // Navigation properties for joins (optional but highly recommended)
        public User Requester { get; set; }
        public User Addressee { get; set; }
    }
    public class Badge
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string IconUrl { get; set; }
    }
    public class UserBadge
    {
        public Guid UserId { get; set; }
        public Guid BadgeId { get; set; }
        public DateTime EarnedAt { get; set; }
    }
    public class Streak
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? CurrentStreak { get; set; }
    }

    // Add these to your combined models file

    public class Post
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? CompletionId { get; set; } // Nullable
        public string? PostText { get; set; }
        public string? PhotoUrl { get; set; }
        public string? VideoUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties for joins
        public User User { get; set; }
        public ICollection<PostLike> PostLikes { get; set; }
        public ICollection<Comment> Comments { get; set; }
    }

    public class PostLike
    {
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class Comment
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public string CommentText { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}
