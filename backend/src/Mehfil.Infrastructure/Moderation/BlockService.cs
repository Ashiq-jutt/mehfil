using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Moderation;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Mehfil.Infrastructure.Moderation;

public sealed class BlockService(MehfilDbContext db, IClock clock) : IBlockService
{
    public async Task<IReadOnlyList<BlockedUserDto>> ListAsync(long userId, CancellationToken ct) =>
        await db.Blocks.AsNoTracking().Where(b => b.BlockerId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BlockedUserDto(b.Blocked.PublicId, b.Blocked.DisplayName, b.Blocked.AvatarUrl, b.CreatedAt))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<BlockedUserDto>> BlockAsync(long userId, string targetPublicId, CancellationToken ct)
    {
        var target = await FindAsync(targetPublicId, ct);
        if (target == userId)
        {
            throw new BadRequestException("blocks.self", "You cannot block yourself.");
        }

        if (!await db.Blocks.AnyAsync(b => b.BlockerId == userId && b.BlockedId == target, ct))
        {
            db.Blocks.Add(new Block { BlockerId = userId, BlockedId = target, CreatedAt = clock.UtcNow });
            await db.SaveChangesAsync(ct);
        }

        return await ListAsync(userId, ct);
    }

    public async Task<IReadOnlyList<BlockedUserDto>> UnblockAsync(long userId, string targetPublicId, CancellationToken ct)
    {
        var target = await FindAsync(targetPublicId, ct);
        await db.Blocks.Where(b => b.BlockerId == userId && b.BlockedId == target).ExecuteDeleteAsync(ct);
        return await ListAsync(userId, ct);
    }

    public Task<bool> IsBlockedEitherWayAsync(long a, long b, CancellationToken ct) =>
        db.Blocks.AsNoTracking().AnyAsync(x => (x.BlockerId == a && x.BlockedId == b) || (x.BlockerId == b && x.BlockedId == a), ct);

    private async Task<long> FindAsync(string publicId, CancellationToken ct)
    {
        var upper = publicId.Trim().ToUpperInvariant();
        return await db.Users.AsNoTracking().Where(u => u.PublicId == upper).Select(u => (long?)u.Id).FirstOrDefaultAsync(ct)
               ?? throw NotFoundException.For("User", publicId);
    }
}
