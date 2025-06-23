using Microsoft.EntityFrameworkCore;
using Adventure.Api.Models;
using System.Reactive;

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
       .HasKey(f => new { f.RequesterId, f.AddresseeId });

            modelBuilder.Entity<Friend>()
                    .HasOne(f => f.Requester)
                    .WithMany() // A user can send many requests
                    .HasForeignKey(f => f.RequesterId)
                    .OnDelete(DeleteBehavior.Restrict); // Avoids complex delete cycles

            modelBuilder.Entity<Friend>()
                .HasOne(f => f.Addressee)
                .WithMany() // A user can receive many requests
                .HasForeignKey(f => f.AddresseeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure the composite primary key for the 'UserBadge' entity
            modelBuilder.Entity<UserBadge>()
                .HasKey(ub => new { ub.UserId, ub.BadgeId });
            modelBuilder.Entity<Profile>()
                      .HasKey(p => p.UserId);

            modelBuilder.Entity<PostLike>()
                .HasKey(pl => new { pl.PostId, pl.UserId }); // Composite key
            modelBuilder.Entity<GroupMember>()
                 .HasKey(gm => new { gm.GroupId, gm.UserId }); // Composite key
        }
        public DbSet<Comment> Comments { get; set; }

        public DbSet<Adventure.Api.Models.Notification> Notifications { get; set; }

        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }

        // In AppDbContext.cs
        public DbSet<GroupChat> GroupChats { get; set; }
    }
}