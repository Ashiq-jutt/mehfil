using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Storage;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Users;

public sealed class UserService(
    MehfilDbContext db,
    IFileStorage files,
    IOptions<StorageOptions> storageOptions,
    ILogger<UserService> logger) : IUserService
{
    public const int DisplayNameMin = 2;
    public const int DisplayNameMax = 32;
    public const int SignatureMax = 120;

    public async Task<UserDto> GetMeAsync(long userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw NotFoundException.For("User", userId);
        return user.ToDto();
    }

    public async Task<ProfileDto> GetProfileAsync(long userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Include(u => u.Country).FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw NotFoundException.For("User", userId);
        return await BuildProfileAsync(user, ct);
    }

    public async Task<PublicProfileDto> GetPublicProfileAsync(string publicId, long viewerId, CancellationToken ct)
    {
        var normalized = publicId.Trim().ToUpperInvariant();
        var user = await db.Users.AsNoTracking().Include(u => u.Country).FirstOrDefaultAsync(u => u.PublicId == normalized, ct)
                   ?? throw NotFoundException.For("User", publicId);

        if (user.Id != viewerId)
        {
            await db.Users.Where(u => u.Id == user.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.ProfileViews, u => u.ProfileViews + 1), ct);
            user.ProfileViews++;
        }

        var achievements = await LoadAchievementsAsync(user.Id, ct);
        var stats = await LoadStatsAsync(user, ct);

        return new PublicProfileDto(
            user.PublicId,
            user.DisplayName,
            user.AvatarUrl,
            user.Signature,
            user.CountryCode,
            user.Country?.Name,
            user.Country?.FlagEmoji,
            user.Gender,
            user.Level,
            user.HeartsReceived,
            user.HeartsGifted,
            user.RoyalLevel,
            user.PrimeLevel,
            user.IsOnline,
            achievements,
            stats,
            user.CreatedAt);
    }

    public async Task<ProfileDto> UpdateProfileAsync(long userId, UpdateProfileRequest request, CancellationToken ct)
    {
        var user = await LoadForUpdateAsync(userId, ct);

        if (request.DisplayName is not null)
        {
            var name = request.DisplayName.Trim();
            if (name.Length < DisplayNameMin || name.Length > DisplayNameMax)
            {
                throw new BadRequestException("profile.invalid_display_name", $"Display name must be {DisplayNameMin}-{DisplayNameMax} characters.");
            }

            user.DisplayName = name;
        }

        if (request.Signature is not null)
        {
            var signature = request.Signature.Trim();
            if (signature.Length > SignatureMax)
            {
                throw new BadRequestException("profile.invalid_signature", $"Signature must be at most {SignatureMax} characters.");
            }

            user.Signature = signature.Length == 0 ? null : signature;
        }

        if (request.CountryCode is not null)
        {
            var code = request.CountryCode.Trim().ToUpperInvariant();
            if (code.Length == 0)
            {
                user.CountryCode = null;
            }
            else
            {
                var exists = await db.Countries.AnyAsync(c => c.Code == code, ct);
                if (!exists)
                {
                    throw new BadRequestException("profile.invalid_country", $"Unknown country code '{code}'.");
                }

                user.CountryCode = code;
            }
        }

        await db.SaveChangesAsync(ct);
        return await GetProfileAsync(userId, ct);
    }

    public async Task<ProfileDto> SetGenderAsync(long userId, Gender gender, CancellationToken ct)
    {
        if (gender == Gender.Unspecified)
        {
            throw new BadRequestException("profile.invalid_gender", "Choose Male, Female or Undisclosed.");
        }

        var user = await LoadForUpdateAsync(userId, ct);
        if (user.GenderLocked)
        {
            throw new ConflictException("profile.gender_locked", "Gender can be updated only once.");
        }

        user.Gender = gender;
        user.GenderLocked = true;
        await db.SaveChangesAsync(ct);
        logger.LogInformation("User {UserId} set gender", userId);
        return await GetProfileAsync(userId, ct);
    }

    public async Task<ProfileDto> SetBirthdayAsync(long userId, int day, int month, CancellationToken ct)
    {
        if (!Birthday.IsValid(day, month))
        {
            throw new BadRequestException("profile.invalid_birthday", "That day and month combination does not exist.");
        }

        var user = await LoadForUpdateAsync(userId, ct);
        user.BirthDay = (byte)day;
        user.BirthMonth = (byte)month;
        await db.SaveChangesAsync(ct);
        return await GetProfileAsync(userId, ct);
    }

    public async Task<ProfileDto> SetAvatarAsync(long userId, Stream image, string? contentType, CancellationToken ct)
    {
        var maxBytes = storageOptions.Value.MaxUploadBytes;

        // Buffer to memory so we can sniff the header and enforce the size cap regardless of stream type.
        using var buffer = new MemoryStream();
        await CopyLimitedAsync(image, buffer, maxBytes, ct);

        if (buffer.Length == 0)
        {
            throw new BadRequestException("profile.avatar_empty", "The uploaded file is empty.");
        }

        var header = buffer.GetBuffer().AsSpan(0, (int)Math.Min(buffer.Length, ImageSniffer.HeaderLength));
        var extension = ImageSniffer.DetectExtension(header)
                        ?? throw new BadRequestException("profile.avatar_unsupported", "Upload a JPEG, PNG or WebP image.");

        var user = await LoadForUpdateAsync(userId, ct);
        var previous = user.AvatarUrl;

        buffer.Position = 0;
        var url = await files.SaveAsync(buffer, $"avatars/{userId}", extension, ct);
        user.AvatarUrl = url;
        await db.SaveChangesAsync(ct);

        await files.DeleteAsync(previous, ct);
        logger.LogInformation("User {UserId} updated avatar ({ContentType}, {Bytes} bytes)", userId, contentType ?? "unknown", buffer.Length);

        return await GetProfileAsync(userId, ct);
    }

    public async Task<IReadOnlyList<UserSearchResultDto>> SearchAsync(string query, long callerId, int limit, CancellationToken ct)
    {
        var q = query.Trim();
        if (q.Length < 2)
        {
            return [];
        }

        var take = Math.Clamp(limit, 1, 50);
        var upper = q.ToUpperInvariant();

        var results = await db.Users.AsNoTracking()
            .Where(u => u.Id != callerId && u.Status == UserStatus.Active &&
                        (u.PublicId == upper || u.DisplayName.Contains(q)))
            .OrderByDescending(u => u.PublicId == upper)
            .ThenByDescending(u => u.DisplayName.StartsWith(q))
            .ThenBy(u => u.DisplayName)
            .Take(take)
            .Select(u => new UserSearchResultDto(u.PublicId, u.DisplayName, u.AvatarUrl, u.Level, u.IsOnline))
            .ToListAsync(ct);

        return results;
    }

    // ------------------------------------------------------------------

    private async Task<User> LoadForUpdateAsync(long userId, CancellationToken ct) =>
        await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw NotFoundException.For("User", userId);

    private async Task<ProfileDto> BuildProfileAsync(User user, CancellationToken ct)
    {
        var achievements = await LoadAchievementsAsync(user.Id, ct);
        var stats = await LoadStatsAsync(user, ct);
        return new ProfileDto(user.ToDto(), user.Country?.Name, user.Country?.FlagEmoji, achievements, stats);
    }

    private async Task<AchievementsDto> LoadAchievementsAsync(long userId, CancellationToken ct)
    {
        var rows = await db.Achievements.AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => new { a.Kind, a.Count })
            .ToListAsync(ct);

        int Count(AchievementKind kind) => rows.FirstOrDefault(r => r.Kind == kind)?.Count ?? 0;

        return new AchievementsDto(
            Count(AchievementKind.TopGifter),
            Count(AchievementKind.TopReceiver),
            Count(AchievementKind.CelebrityOfTheMonth),
            Count(AchievementKind.WeeklyTopClub));
    }

    private async Task<StatsDto> LoadStatsAsync(User user, CancellationToken ct)
    {
        var clubsFollowed = await db.ClubFollows.CountAsync(f => f.UserId == user.Id, ct);
        var clubsJoined = await db.ClubMembers.CountAsync(m => m.UserId == user.Id, ct);
        var giftsSent = await db.GiftTransactions.Where(g => g.SenderId == user.Id).SumAsync(g => (long?)g.Quantity, ct) ?? 0;
        var giftsReceived = await db.GiftTransactions.Where(g => g.ReceiverId == user.Id).SumAsync(g => (long?)g.Quantity, ct) ?? 0;

        return new StatsDto(user.Level, user.ActiveSeconds, clubsFollowed, clubsJoined, giftsSent, giftsReceived, user.ProfileViews);
    }

    private static async Task CopyLimitedAsync(Stream source, Stream destination, long maxBytes, CancellationToken ct)
    {
        var chunk = new byte[64 * 1024];
        long total = 0;
        int read;
        while ((read = await source.ReadAsync(chunk, ct)) > 0)
        {
            total += read;
            if (total > maxBytes)
            {
                throw new BadRequestException("profile.avatar_too_large", $"Images must be at most {maxBytes / (1024 * 1024)} MB.");
            }

            await destination.WriteAsync(chunk.AsMemory(0, read), ct);
        }
    }
}
