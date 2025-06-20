namespace Adventure.Api.Models
{
    public class Notification
    {
        public Guid Id { get; set; }

        // Corresponds to the 'user_id' column (the user who receives the notification)
        public Guid UserId { get; set; }

        // Corresponds to the 'actor_user_id' column (the user who performed the action)
        public Guid? ActorUserId { get; set; } // Nullable, as some notifications might be system-generated

        // Corresponds to the 'type' column (e.g., "new_post", "friend_request")
        public string Type { get; set; }

        // Corresponds to the 'entity_id' column (e.g., the ID of the post that was liked)
        public Guid? EntityId { get; set; } // Nullable

        // Corresponds to the 'message' column
        public string Message { get; set; }

        // Corresponds to the 'is_read' column
        public bool IsRead { get; set; }

        // Corresponds to the 'created_at' column
        public DateTime CreatedAt { get; set; }
    }
}
