using Adventure.Api.Data;
using Adventure.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Adventure.Api.Services;

public class BadgeService : IBadgeService
{
    private readonly AppDbContext _context;

    // A private dictionary to hold our known Badge IDs for clean, readable code.
    // These IDs match the ones from the SQL script.
    private static readonly Dictionary<string, Guid> BadgeIds = new()
    {
        { "FirstAdventure", Guid.Parse("00000000-0000-0000-0000-000000000001") },
        { "AdventurousFive", Guid.Parse("00000000-0000-0000-0000-000000000002") },
        { "ExplorerTen", Guid.Parse("00000000-0000-0000-0000-000000000003") },
        { "SeasonedVoyager", Guid.Parse("00000000-0000-0000-0000-000000000004") },
        { "Foodie", Guid.Parse("00000000-0000-0000-0000-000000000005") },
        { "CultureVulture", Guid.Parse("00000000-0000-0000-0000-000000000006") },
        { "Outdoorsy", Guid.Parse("00000000-0000-0000-0000-000000000007") },
        { "GoodSamaritan", Guid.Parse("00000000-0000-0000-0000-000000000008") },
        { "StreakStarter", Guid.Parse("00000000-0000-0000-0000-000000000009") },
        { "WeeklyWarrior", Guid.Parse("00000000-0000-0000-0000-000000000010") },
        { "SocialButterfly", Guid.Parse("00000000-0000-0000-0000-000000000011") },
        { "FirstPost", Guid.Parse("00000000-0000-0000-0000-000000000012") },
    };

    public BadgeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task CheckAndAwardBadgesAsync(Guid userId)
    {
        // Get all badges the user has already earned for efficient checking.
        var userBadgeIds = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .Select(ub => ub.BadgeId)
            .ToHashSetAsync();

        // Fetch all necessary stats in one go to be efficient.
        var completionsCount = await _context.Completions.CountAsync(c => c.UserId == userId);
        var postCount = await _context.Posts.CountAsync(p => p.UserId == userId);
        var friendCount = await _context.Friends.CountAsync(f => f.RequesterId == userId && f.Status == "accepted");
        var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.UserId == userId);

        // --- Check Rules for Each Badge ---

        // Completion-Based Rules
        if (completionsCount >= 1) AwardBadgeIfMissing(userId, "FirstAdventure", userBadgeIds);
        if (completionsCount >= 5) AwardBadgeIfMissing(userId, "AdventurousFive", userBadgeIds);
        if (completionsCount >= 10) AwardBadgeIfMissing(userId, "ExplorerTen", userBadgeIds);
        if (completionsCount >= 25) AwardBadgeIfMissing(userId, "SeasonedVoyager", userBadgeIds);

        // Social-Based Rules
        if (postCount >= 1) AwardBadgeIfMissing(userId, "FirstPost", userBadgeIds);
        if (friendCount >= 1) AwardBadgeIfMissing(userId, "SocialButterfly", userBadgeIds);

        // Streak-Based Rules
        if (streak?.CurrentStreak >= 3) AwardBadgeIfMissing(userId, "StreakStarter", userBadgeIds);
        if (streak?.CurrentStreak >= 7) AwardBadgeIfMissing(userId, "WeeklyWarrior", userBadgeIds);

        // Category-Based Rules (These require more specific queries)
        if (!userBadgeIds.Contains(BadgeIds["Foodie"]))
        {
            if (await _context.Completions.Include(c => c.Challenge).CountAsync(c => c.UserId == userId && c.Challenge.Category == "food") >= 3)
                AwardBadgeIfMissing(userId, "Foodie", userBadgeIds);
        }
        if (!userBadgeIds.Contains(BadgeIds["CultureVulture"]))
        {
            if (await _context.Completions.Include(c => c.Challenge).CountAsync(c => c.UserId == userId && c.Challenge.Category == "culture") >= 3)
                AwardBadgeIfMissing(userId, "CultureVulture", userBadgeIds);
        }
        if (!userBadgeIds.Contains(BadgeIds["Outdoorsy"]))
        {
            if (await _context.Completions.Include(c => c.Challenge).CountAsync(c => c.UserId == userId && c.Challenge.Category == "outdoors") >= 3)
                AwardBadgeIfMissing(userId, "Outdoorsy", userBadgeIds);
        }
        if (!userBadgeIds.Contains(BadgeIds["GoodSamaritan"]))
        {
            if (await _context.Completions.Include(c => c.Challenge).CountAsync(c => c.UserId == userId && c.Challenge.Category == "other") >= 3)
                AwardBadgeIfMissing(userId, "GoodSamaritan", userBadgeIds);
        }

        // After checking all rules, save any newly awarded badges to the database in a single transaction.
        await _context.SaveChangesAsync();
    }

    private void AwardBadgeIfMissing(Guid userId, string badgeKey, HashSet<Guid> existingBadges)
    {
        var badgeId = BadgeIds[badgeKey];
        if (existingBadges.Contains(badgeId))
        {
            return; // User already has this badge.
        }

        // Add the badge to the context's internal change tracker.
        // It won't be saved to the DB until SaveChangesAsync() is called.
        _context.UserBadges.Add(new UserBadge { UserId = userId, BadgeId = badgeId, EarnedAt = DateTime.UtcNow });

        // Also add it to our local HashSet so we don't try to award it again in this same operation.
        existingBadges.Add(badgeId);
    }
}