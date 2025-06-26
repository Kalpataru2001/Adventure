using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Adventure.Api.Hubs
{
    // The UserIdProvider is still correct and needed.
    public class UserIdProvider : IUserIdProvider
    {
        public virtual string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }

    // This is the original, simple hub.
    // It is authorized and its only job is to be a target for server-sent messages.
    [Authorize]
    public class NotificationHub : Hub
    {
        // This hub has no client-callable methods. It only listens for the server.
    }
}