namespace Adventure.Api.Models
{
    public class Completion
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ChallengeId { get; set; }
        public DateTime AcceptedAt { get; set; }
        public DateTime? CompletedAt { get; set; } // Nullable for now
        public string? PhotoUrl { get; set; }
        public string? VideoUrl { get; set; }
        public Challenge Challenge { get; set; }
    }
}
