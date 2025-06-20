using Microsoft.EntityFrameworkCore;
using Adventure.Api.Models;

namespace Adventure.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Challenge> Challenges { get; set; }

        // This will now compile correctly because the namespace is right.
        public DbSet<User> Users { get; set; }
        public DbSet<Completion> Completions { get; set; }

        // profile
        public DbSet<Friend> Friends { get; set; }
        public DbSet<Badge> Badges { get; set; }
        public DbSet<UserBadge> UserBadges { get; set; }
        public DbSet<Streak> Streaks { get; set; }

        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostLike> PostLikes { get; set; }


        // --- Add this method to configure composite keys ---
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Profile>()
              .HasKey(p => p.UserId); // The primary key is UserId

            // Configure the composite primary key for the 'Friend' entity
            modelBuilder.Entity<Friend>()
                .HasKey(f => new { f.UserId, f.FriendId });

            // Configure the composite primary key for the 'UserBadge' entity
            modelBuilder.Entity<UserBadge>()
                .HasKey(ub => new { ub.UserId, ub.BadgeId });

            modelBuilder.Entity<PostLike>()
                .HasKey(pl => new { pl.PostId, pl.UserId }); // Composite key
        }
        public DbSet<Comment> Comments { get; set; }


    }
}