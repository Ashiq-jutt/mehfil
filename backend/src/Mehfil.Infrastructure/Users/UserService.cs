using Mehfil.Core.Common;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Mehfil.Infrastructure.Users;

public sealed class UserService(MehfilDbContext db) : IUserService
{
    public async Task<UserDto> GetMeAsync(long userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw NotFoundException.For("User", userId);
        return user.ToDto();
    }
}
