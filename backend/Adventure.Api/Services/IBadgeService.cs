namespace Adventure.Api.Services
{
    public interface IBadgeService
    {
        Task CheckAndAwardBadgesAsync(Guid userId);
    }
}
