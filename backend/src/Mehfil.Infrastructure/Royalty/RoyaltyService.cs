using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Royalty;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Mehfil.Infrastructure.Royalty;

public sealed class RoyaltyService(MehfilDbContext db) : IRoyaltyService
{
    public async Task<RoyaltyDto> GetAsync(long userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.RoyaltyPoints, u.RoyalLevel, u.HighestRoyalLevel, u.PrimeLevel, u.RoyalStreakMonths })
            .FirstOrDefaultAsync(ct) ?? throw NotFoundException.For("User", userId);

        var next = RoyaltyLevels.Next(user.RoyaltyPoints);

        var royal = RoyaltyLevels.Royal
            .Select(r => new RoyaltyLevelDto(r.Level.ToString(), (int)r.Level, r.Points, user.RoyaltyPoints >= r.Points, null))
            .OrderByDescending(r => r.Rank)
            .ToList();

        var prime = RoyaltyLevels.Prime
            .Select(p => new RoyaltyLevelDto(p.Level.ToString(), (int)p.Level, p.Points, user.RoyaltyPoints >= p.Points, null))
            .OrderByDescending(p => p.Rank)
            .ToList();

        return new RoyaltyDto(
            user.RoyaltyPoints,
            user.RoyalLevel,
            user.HighestRoyalLevel,
            user.PrimeLevel,
            user.RoyalStreakMonths,
            next?.Code,
            next is null ? null : next.Value.PointsRequired - user.RoyaltyPoints,
            royal,
            prime,
            RoyaltyLevels.Benefits);
    }
}
