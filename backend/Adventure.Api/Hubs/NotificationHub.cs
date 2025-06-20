using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Adventure.Api.Hubs
{
    public class UserIdProvider : IUserIdProvider
    {
        public virtual string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
    public class NotificationHub : Hub
    {
    }
}
