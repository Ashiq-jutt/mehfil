using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Notifications;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Clubs;

public sealed class ClubMembersService(MehfilDbContext db, INotificationService notifications, IClock clock, ILogger<ClubMembersService> logger) : IClubMembersService
{
    public const int MaxAdmins = 7;

    public async Task<PagedResult<ClubMemberDto>> ListMembersAsync(string clubPublicId, ClubRole? role, string? search, int? page, int? pageSize, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        var (p, size) = Paging.Normalize(page, pageSize);

        var query = db.ClubMembers.AsNoTracking().Where(m => m.ClubId == club.Id);
        if (role is not null)
        {
            query = query.Where(m => m.Role == role);
        }

        query = ApplySearch(query, search);

        var total = await query.CountAsync(ct);
        var items = await Project(query
                .OrderByDescending(m => m.Role)
                .ThenByDescending(m => m.User.IsOnline)
                .ThenBy(m => m.User.DisplayName)
                .Skip((p - 1) * size)
                .Take(size))
            .ToListAsync(ct);

        return new PagedResult<ClubMemberDto>(items, p, size, total);
    }

    public async Task<ClubAdminsDto> ListAdminsAsync(string clubPublicId, string? search, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        return await BuildAdminsAsync(club.Id, search, ct);
    }

    public async Task<ClubAdminsDto> PromoteAdminAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        EnsureOwner(club, actorId);

        var user = await db.Users.FirstOrDefaultAsync(u => u.PublicId == userPublicId.Trim().ToUpperInvariant(), ct)
                   ?? throw NotFoundException.For("User", userPublicId);
        if (user.Id == club.OwnerId)
        {
            throw new BadRequestException("clubs.owner_is_admin", "The owner already has full control.");
        }

        var adminCount = await db.ClubMembers.CountAsync(m => m.ClubId == club.Id && m.Role == ClubRole.Admin, ct);
        var member = await db.ClubMembers.FirstOrDefaultAsync(m => m.ClubId == club.Id && m.UserId == user.Id, ct);

        if (member?.Role == ClubRole.Admin)
        {
            return await BuildAdminsAsync(club.Id, null, ct);
        }

        if (adminCount >= MaxAdmins)
        {
            throw new ConflictException("clubs.admin_limit", $"A club can have at most {MaxAdmins} admins.");
        }

        var now = clock.UtcNow;
        if (member is null)
        {
            db.ClubMembers.Add(new ClubMember { ClubId = club.Id, UserId = user.Id, Role = ClubRole.Admin, JoinedAt = now, LastActiveAt = now });
            club.MemberCount++;
        }
        else
        {
            member.Role = ClubRole.Admin;
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("User {ActorId} promoted {UserId} to admin of club {ClubId}", actorId, user.Id, club.PublicId);
        await notifications.NotifyAsync(
            user.Id,
            NotificationType.AdminGranted,
            $"You are now an admin of {club.Name}",
            "You can manage seats, the announcement and members in the room.",
            new Dictionary<string, string> { ["clubId"] = club.PublicId },
            ct);
        return await BuildAdminsAsync(club.Id, null, ct);
    }

    public async Task<ClubAdminsDto> DemoteAdminAsync(string clubPublicId, string userPublicId, long actorId, CancellationToken ct)
    {
        var club = await LoadClubAsync(clubPublicId, ct);
        EnsureOwner(club, actorId);

        var upper = userPublicId.Trim().ToUpperInvariant();
        var member = await db.ClubMembers.Include(m => m.User)
            .FirstOrDefaultAsync(m => m.ClubId == club.Id && m.User.PublicId == upper, ct);

        if (member?.Role == ClubRole.Admin)
        {
            member.Role = ClubRole.Member;
            await db.SaveChangesAsync(ct);
            logger.LogInformation("User {ActorId} removed admin {UserId} from club {ClubId}", actorId, member.UserId, club.PublicId);
        }

        return await BuildAdminsAsync(club.Id, null, ct);
    }

    // ------------------------------------------------------------------

    private async Task<ClubAdminsDto> BuildAdminsAsync(long clubId, string? search, CancellationToken ct)
    {
        var query = db.ClubMembers.AsNoTracking()
            .Where(m => m.ClubId == clubId && (m.Role == ClubRole.Owner || m.Role == ClubRole.Admin));
        query = ApplySearch(query, search);

        var admins = await Project(query.OrderByDescending(m => m.Role).ThenBy(m => m.JoinedAt)).ToListAsync(ct);
        return new ClubAdminsDto(MaxAdmins, admins);
    }

    private static IQueryable<ClubMember> ApplySearch(IQueryable<ClubMember> query, string? search)
    {
        var q = search?.Trim();
        if (string.IsNullOrEmpty(q))
        {
            return query;
        }

        var upper = q.ToUpperInvariant();
        return query.Where(m => m.User.DisplayName.Contains(q) || m.User.PublicId == upper);
    }

    private static IQueryable<ClubMemberDto> Project(IQueryable<ClubMember> query) =>
        query.Select(m => new ClubMemberDto(
            m.User.PublicId,
            m.User.DisplayName,
            m.User.AvatarUrl,
            m.User.Level,
            m.Role,
            m.User.IsOnline,
            m.JoinedAt));

    private async Task<Club> LoadClubAsync(string publicId, CancellationToken ct) =>
        await db.Clubs.FirstOrDefaultAsync(c => c.PublicId == publicId.Trim() && c.IsActive, ct)
        ?? throw NotFoundException.For("Club", publicId);

    private static void EnsureOwner(Club club, long actorId)
    {
        if (club.OwnerId != actorId)
        {
            throw new ForbiddenException("clubs.owner_only", "Only the club owner can manage admins.");
        }
    }
}
