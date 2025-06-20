using Adventure.Api.Models;

namespace Adventure.Api.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
