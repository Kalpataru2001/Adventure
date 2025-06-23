// Models/Challenge.cs
using System.ComponentModel.DataAnnotations;

namespace Adventure.Api.Models
{
    public class Challenge
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public int? Difficulty { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }
}
