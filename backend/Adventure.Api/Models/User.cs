using System.ComponentModel.DataAnnotations.Schema;

namespace Adventure.Api.Models
{
    //[Table("users")] 
    public class User
    {
        [Column("id")]
        public Guid Id { get; set; }

        [Column("first_name")]
        public string FirstName { get; set; }

        [Column("last_name")]
        public string LastName { get; set; }

        [Column("email")] // <-- Fixes the current error
        public string Email { get; set; }

        [Column("password_hash")]
        public string? PasswordHash { get; set; }

        [Column("dob")]
        public DateTime Dob { get; set; }

        [Column("google_id")]
        public string? GoogleId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }
    }
}
