using Mehfil.Core.Clubs;
using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Storage;
using Mehfil.Infrastructure.Auth;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Clubs;

public sealed class ClubService(
    MehfilDbContext db,
    IFileStorage files,
    IOptions<StorageOptions> storageOptions,
    IClock clock,
    ILogger<ClubService> logger) : IClubService
{
    public const int NameMin = 3;
    public const int NameMax = 48;
    public const int LanguageMax = 32;
    public const int AnnouncementMax = 500;
    public const string DefaultLanguage = "English";
    public const long InitialJarTarget = 500;
    public const int InitialJarsForNextLevel = 150;
    private const int PublicIdAttempts = 10;

    // ---- Listing ---------------------------------------------------------

    public async Task<PagedResult<ClubCardDto>> ListAsync(ClubFeed feed, string? countryCode, int? page, int? pageSize, long userId, CancellationToken ct)
    {
        var (p, size) = Paging.Normalize(page, pageSize);
        var query = db.Clubs.AsNoTracking().Where(c => c.IsActive);

        var country = NormalizeCountry(countryCode);
        if (country is not null)
        {
            query = query.Where(c => c.CountryCode == country);
        }

        query = feed switch
        {
            ClubFeed.Hot => query
                .OrderByDescending(c => c.OnlineCount)
                .ThenByDescending(c => c.TotalHearts)
                .ThenByDescending(c => c.MemberCount)
                .ThenByDescending(c => c.Id),
            _ => query
                .OrderByDescending(c => c.OnlineCount)
                .ThenByDescending(c => c.Level)
                .ThenByDescending(c => c.FollowerCount)
                .ThenByDescending(c => c.Id),
        };

        var total = await query.CountAsync(ct);
        var items = await ProjectCards(query.Skip((p - 1) * size).Take(size), userId).ToListAsync(ct);
        return new PagedResult<ClubCardDto>(items, p, size, total);
    }

    public async Task<PagedResult<ClubCardDto>> ListMineAsync(MyClubsFilter filter, int? page, int? pageSize, long userId, CancellationToken ct)
    {
        var (p, size) = Paging.Normalize(page, pageSize);

        if (filter == MyClubsFilter.Recents)
        {
            var visits = db.ClubVisits.AsNoTracking()
                .Where(v => v.UserId == userId && v.Club.IsActive)
                .OrderByDescending(v => v.LastVisitedAt)
                .Select(v => v.Club);

            var visitTotal = await visits.CountAsync(ct);
            var visitItems = await ProjectCards(visits.Skip((p - 1) * size).Take(size), userId).ToListAsync(ct);
            return new PagedResult<ClubCardDto>(visitItems, p, size, visitTotal);
        }

        // Own club first (there is at most one), then followed clubs newest-first.
        var owned = db.Clubs.AsNoTracking().Where(c => c.IsActive && c.OwnerId == userId).Select(c => new { Club = c, Order = 0L });
        var followed = db.ClubFollows.AsNoTracking()
            .Where(f => f.UserId == userId && f.Club.IsActive && f.Club.OwnerId != userId)
            .Select(f => new { Club = f.Club, Order = 1L });

        var ownedTotal = await owned.CountAsync(ct);
        var followedTotal = await followed.CountAsync(ct);

        var ownedCards = p == 1 ? await ProjectCards(owned.Select(x => x.Club), userId).ToListAsync(ct) : [];
        var skip = Math.Max(0, (p - 1) * size - ownedTotal);
        var take = size - ownedCards.Count;
        var followedQuery = db.ClubFollows.AsNoTracking()
            .Where(f => f.UserId == userId && f.Club.IsActive && f.Club.OwnerId != userId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => f.Club)
            .Skip(skip)
            .Take(take);
        var followedCards = take > 0 ? await ProjectCards(followedQuery, userId).ToListAsync(ct) : [];

        return new PagedResult<ClubCardDto>([.. ownedCards, .. followedCards], p, size, ownedTotal + followedTotal);
    }

    public async Task<IReadOnlyList<ClubCardDto>> TopAsync(int count, long userId, CancellationToken ct)
    {
        var query = db.Clubs.AsNoTracking()
            .Where(c => c.IsActive && c.TotalHearts > 0)
            .OrderByDescending(c => c.TotalHearts)
            .ThenByDescending(c => c.FollowerCount)
            .Take(Math.Clamp(count, 1, 10));
        return await ProjectCards(query, userId).ToListAsync(ct);
    }

    public async Task<ClubCardDto> FindByPublicIdAsync(string publicId, long userId, CancellationToken ct)
    {
        var id = publicId.Trim();
        var card = await ProjectCards(db.Clubs.AsNoTracking().Where(c => c.PublicId == id && c.IsActive), userId).FirstOrDefaultAsync(ct);
        return card ?? throw NotFoundException.For("Club", publicId);
    }

    // ---- Detail ----------------------------------------------------------

    public async Task<ClubDetailDto> GetAsync(string publicId, long userId, CancellationToken ct)
    {
        var club = await LoadAsync(publicId, ct);

        if (club.OwnerId != userId)
        {
            await RecordVisitAsync(club.Id, userId, ct);
        }

        return await BuildDetailAsync(club, userId, ct);
    }

    public async Task<ClubDetailDto> CreateAsync(long ownerId, CreateClubRequest request, CancellationToken ct)
    {
        var name = ValidateName(request.Name);
        var alreadyOwner = await db.Clubs.AnyAsync(c => c.OwnerId == ownerId && c.IsActive, ct);
        if (alreadyOwner)
        {
            throw new ConflictException("clubs.already_owner", "You already own a club. Edit it from the My tab.");
        }

        var category = await db.ClubCategories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct)
                       ?? throw new BadRequestException("clubs.invalid_category", "Unknown club category.");
        var country = await ValidateCountryAsync(request.CountryCode, ct);
        var now = clock.UtcNow;

        for (var attempt = 1; attempt <= PublicIdAttempts; attempt++)
        {
            var club = new Club
            {
                PublicId = PublicIds.ForClub(),
                Name = name,
                CategoryId = category.Id,
                CountryCode = country,
                Language = NormalizeLanguage(request.Language),
                Announcement = NormalizeAnnouncement(request.Announcement),
                OwnerId = ownerId,
                Level = 1,
                JarTarget = InitialJarTarget,
                JarResetsAt = NextJarReset(now),
                JarsForNextLevel = InitialJarsForNextLevel,
                MemberCount = 1,
                IsActive = true,
            };
            club.Members.Add(new ClubMember { UserId = ownerId, Role = ClubRole.Owner, JoinedAt = now, LastActiveAt = now });
            for (byte seat = 1; seat <= Club.SeatCount; seat++)
            {
                club.Seats.Add(new ClubSeat { SeatIndex = seat });
            }

            db.Clubs.Add(club);
            try
            {
                await db.SaveChangesAsync(ct);
                logger.LogInformation("User {UserId} created club {ClubId}", ownerId, club.PublicId);
                return await BuildDetailAsync(await LoadAsync(club.PublicId, ct), ownerId, ct);
            }
            catch (DbUpdateException) when (attempt < PublicIdAttempts)
            {
                db.Entry(club).State = EntityState.Detached;
                foreach (var m in club.Members) db.Entry(m).State = EntityState.Detached;
                foreach (var s in club.Seats) db.Entry(s).State = EntityState.Detached;
            }
        }

        throw new ConflictException("clubs.create_failed", "Could not create the club. Please try again.");
    }

    public async Task<ClubDetailDto> UpdateAsync(string publicId, long userId, UpdateClubRequest request, CancellationToken ct)
    {
        var club = await LoadAsync(publicId, ct);
        await EnsureCanManageAsync(club.Id, userId, ct);

        if (request.Name is not null)
        {
            club.Name = ValidateName(request.Name);
        }

        if (request.CategoryId is not null)
        {
            var exists = await db.ClubCategories.AnyAsync(c => c.Id == request.CategoryId, ct);
            if (!exists)
            {
                throw new BadRequestException("clubs.invalid_category", "Unknown club category.");
            }

            club.CategoryId = request.CategoryId.Value;
        }

        if (request.CountryCode is not null)
        {
            club.CountryCode = await ValidateCountryAsync(request.CountryCode, ct);
        }

        if (request.Language is not null)
        {
            club.Language = NormalizeLanguage(request.Language);
        }

        if (request.Announcement is not null)
        {
            club.Announcement = NormalizeAnnouncement(request.Announcement);
        }

        await db.SaveChangesAsync(ct);
        return await BuildDetailAsync(await LoadAsync(publicId, ct), userId, ct);
    }

    public async Task<ClubDetailDto> SetCoverAsync(string publicId, long userId, Stream image, CancellationToken ct)
    {
        var club = await LoadAsync(publicId, ct);
        await EnsureCanManageAsync(club.Id, userId, ct);

        using var buffer = new MemoryStream();
        var max = storageOptions.Value.MaxUploadBytes;
        var chunk = new byte[64 * 1024];
        int read;
        while ((read = await image.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > max)
            {
                throw new BadRequestException("clubs.cover_too_large", $"Images must be at most {max / (1024 * 1024)} MB.");
            }

            await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
        }

        var header = buffer.GetBuffer().AsSpan(0, (int)Math.Min(buffer.Length, ImageSniffer.HeaderLength));
        var extension = ImageSniffer.DetectExtension(header)
                        ?? throw new BadRequestException("clubs.cover_unsupported", "Upload a JPEG, PNG or WebP image.");

        buffer.Position = 0;
        var previous = club.CoverUrl;
        club.CoverUrl = await files.SaveAsync(buffer, $"clubs/{club.Id}", extension, ct);
        await db.SaveChangesAsync(ct);
        await files.DeleteAsync(previous, ct);

        return await BuildDetailAsync(await LoadAsync(publicId, ct), userId, ct);
    }

    // ---- Follow ----------------------------------------------------------

    public async Task<FollowResultDto> FollowAsync(string publicId, long userId, CancellationToken ct)
    {
        var club = await LoadAsync(publicId, ct);
        var exists = await db.ClubFollows.AnyAsync(f => f.ClubId == club.Id && f.UserId == userId, ct);
        if (!exists)
        {
            db.ClubFollows.Add(new ClubFollow { ClubId = club.Id, UserId = userId, CreatedAt = clock.UtcNow });
            club.FollowerCount++;
            await db.SaveChangesAsync(ct);
        }

        return new FollowResultDto(true, club.FollowerCount);
    }

    public async Task<FollowResultDto> UnfollowAsync(string publicId, long userId, CancellationToken ct)
    {
        var club = await LoadAsync(publicId, ct);
        var follow = await db.ClubFollows.FirstOrDefaultAsync(f => f.ClubId == club.Id && f.UserId == userId, ct);
        if (follow is not null)
        {
            db.ClubFollows.Remove(follow);
            club.FollowerCount = Math.Max(0, club.FollowerCount - 1);
            await db.SaveChangesAsync(ct);
        }

        return new FollowResultDto(false, club.FollowerCount);
    }

    // ---- Helpers ---------------------------------------------------------

    private IQueryable<ClubCardDto> ProjectCards(IQueryable<Club> query, long userId) =>
        query.Select(c => new ClubCardDto(
            c.PublicId,
            c.Name,
            c.CoverUrl,
            c.CountryCode,
            c.Country != null ? c.Country.FlagEmoji : null,
            c.Category.Code,
            c.Category.Name,
            c.Level,
            c.OnlineCount,
            c.MemberCount,
            c.FollowerCount,
            c.TotalHearts,
            c.OnlineCount > 0,
            db.ClubFollows.Any(f => f.ClubId == c.Id && f.UserId == userId),
            c.OwnerId == userId));

    private async Task<Club> LoadAsync(string publicId, CancellationToken ct)
    {
        var id = publicId.Trim();
        return await db.Clubs
                   .Include(c => c.Country)
                   .Include(c => c.Category)
                   .Include(c => c.Owner)
                   .FirstOrDefaultAsync(c => c.PublicId == id && c.IsActive, ct)
               ?? throw NotFoundException.For("Club", publicId);
    }

    private async Task<ClubDetailDto> BuildDetailAsync(Club club, long userId, CancellationToken ct)
    {
        var adminCount = await db.ClubMembers.CountAsync(m => m.ClubId == club.Id && m.Role == ClubRole.Admin, ct);
        var isFollowing = await db.ClubFollows.AnyAsync(f => f.ClubId == club.Id && f.UserId == userId, ct);
        var myRole = await db.ClubMembers.Where(m => m.ClubId == club.Id && m.UserId == userId).Select(m => (ClubRole?)m.Role).FirstOrDefaultAsync(ct);

        return new ClubDetailDto(
            club.PublicId,
            club.Name,
            club.CoverUrl,
            club.CountryCode,
            club.Country?.Name,
            club.Country?.FlagEmoji,
            club.CategoryId,
            club.Category.Code,
            club.Category.Name,
            club.Language,
            club.Announcement,
            new ClubOwnerDto(club.Owner.PublicId, club.Owner.DisplayName, club.Owner.AvatarUrl, club.Owner.Level),
            adminCount,
            club.MemberCount,
            club.FollowerCount,
            club.OnlineCount,
            club.Level,
            club.JarHearts,
            club.JarTarget,
            club.JarResetsAt,
            club.JarsCollected,
            club.JarsForNextLevel,
            club.TotalHearts,
            club.WeeklyTopClubCount,
            club.ActiveSeconds,
            club.OnlineCount > 0,
            isFollowing,
            myRole,
            club.CreatedAt);
    }

    private async Task EnsureCanManageAsync(long clubId, long userId, CancellationToken ct)
    {
        var role = await db.ClubMembers.Where(m => m.ClubId == clubId && m.UserId == userId).Select(m => (ClubRole?)m.Role).FirstOrDefaultAsync(ct);
        if (role is not (ClubRole.Owner or ClubRole.Admin))
        {
            throw new ForbiddenException("clubs.forbidden", "Only the club owner or an admin can do that.");
        }
    }

    private async Task RecordVisitAsync(long clubId, long userId, CancellationToken ct)
    {
        var now = clock.UtcNow;
        var updated = await db.ClubVisits
            .Where(v => v.ClubId == clubId && v.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.LastVisitedAt, now), ct);
        if (updated == 0)
        {
            db.ClubVisits.Add(new ClubVisit { ClubId = clubId, UserId = userId, LastVisitedAt = now });
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Concurrent first visit; the other writer won.
            }
        }
    }

    private async Task<string?> ValidateCountryAsync(string? countryCode, CancellationToken ct)
    {
        var code = NormalizeCountry(countryCode);
        if (code is null)
        {
            return null;
        }

        var exists = await db.Countries.AnyAsync(c => c.Code == code, ct);
        return exists ? code : throw new BadRequestException("clubs.invalid_country", $"Unknown country code '{code}'.");
    }

    private static string? NormalizeCountry(string? value)
    {
        var code = value?.Trim().ToUpperInvariant();
        return string.IsNullOrEmpty(code) || code == "GLOBAL" ? null : code;
    }

    private static string ValidateName(string value)
    {
        var name = value.Trim();
        if (name.Length < NameMin || name.Length > NameMax)
        {
            throw new BadRequestException("clubs.invalid_name", $"Club name must be {NameMin}-{NameMax} characters.");
        }

        return name;
    }

    private static string NormalizeLanguage(string? value)
    {
        var language = value?.Trim();
        if (string.IsNullOrEmpty(language))
        {
            return DefaultLanguage;
        }

        return language.Length <= LanguageMax ? language : language[..LanguageMax];
    }

    private static string? NormalizeAnnouncement(string? value)
    {
        var text = value?.Trim();
        if (string.IsNullOrEmpty(text))
        {
            return null;
        }

        if (text.Length > AnnouncementMax)
        {
            throw new BadRequestException("clubs.invalid_announcement", $"Announcement must be at most {AnnouncementMax} characters.");
        }

        return text;
    }

    /// <summary>Jars reset daily at 00:00 UTC.</summary>
    public static DateTimeOffset NextJarReset(DateTimeOffset now) =>
        new(now.UtcDateTime.Date.AddDays(1), TimeSpan.Zero);
}
