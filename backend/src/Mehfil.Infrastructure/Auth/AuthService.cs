using Mehfil.Core.Auth;
using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Options;
using Mehfil.Core.Users;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Auth;

public sealed class AuthService(
    MehfilDbContext db,
    IGoogleTokenValidator google,
    IAccessTokenService accessTokens,
    IClock clock,
    IOptions<JwtOptions> jwtOptions,
    IOptions<DevLoginOptions> devLoginOptions,
    IHostEnvironment environment,
    ILogger<AuthService> logger) : IAuthService
{
    private const int PublicIdAttempts = 10;

    public async Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, AuthContext context, CancellationToken ct)
    {
        var info = await google.ValidateAsync(request.IdToken, ct);
        var (user, isNew) = await FindOrCreateUserAsync(info, ct);
        EnsureCanSignIn(user);
        return await IssueAsync(user, isNew, context, ct);
    }

    public async Task<AuthResponse> LoginDevAsync(DevLoginRequest request, AuthContext context, CancellationToken ct)
    {
        if (!devLoginOptions.Value.Enabled || !environment.IsDevelopment())
        {
            throw new NotFoundException("auth.dev_login_disabled", "Dev login is not available.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var info = new GoogleUserInfo($"dev:{email}", email, true, request.DisplayName, null);
        var (user, isNew) = await FindOrCreateUserAsync(info, ct);
        EnsureCanSignIn(user);
        return await IssueAsync(user, isNew, context, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, AuthContext context, CancellationToken ct)
    {
        var now = clock.UtcNow;
        var hash = RefreshTokens.Hash(refreshToken);
        var token = await db.RefreshTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token is null)
        {
            throw new UnauthorizedException("auth.invalid_refresh_token", "The refresh token is invalid.");
        }

        if (!token.IsActive(now))
        {
            if (token.ReplacedByTokenHash is not null)
            {
                // A rotated token was presented again: assume theft and revoke every active session.
                logger.LogWarning("Refresh token reuse detected for user {UserId}; revoking all sessions", token.UserId);
                await db.RefreshTokens
                    .Where(t => t.UserId == token.UserId && t.RevokedAt == null)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now), ct);
            }

            throw new UnauthorizedException("auth.invalid_refresh_token", "The refresh token is expired or revoked.");
        }

        EnsureCanSignIn(token.User);

        var (raw, entity) = NewRefreshToken(token.UserId, now, context);
        token.RevokedAt = now;
        token.ReplacedByTokenHash = entity.TokenHash;
        db.RefreshTokens.Add(entity);
        token.User.LastSeenAt = now;

        // Opportunistic cleanup of long-expired tokens for this user.
        var cutoff = now.AddDays(-7);
        await db.RefreshTokens
            .Where(t => t.UserId == token.UserId && t.ExpiresAt < cutoff)
            .ExecuteDeleteAsync(ct);

        await db.SaveChangesAsync(ct);

        return BuildResponse(token.User, raw, entity, isNew: false);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var hash = RefreshTokens.Hash(refreshToken);
        var now = clock.UtcNow;
        await db.RefreshTokens
            .Where(t => t.TokenHash == hash && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now), ct);
    }

    // ---------------------------------------------------------------------

    private async Task<(User User, bool IsNew)> FindOrCreateUserAsync(GoogleUserInfo info, CancellationToken ct)
    {
        var email = info.Email.Trim().ToLowerInvariant();

        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSubject == info.Subject, ct);
        if (user is not null)
        {
            return (user, false);
        }

        // Same email, different Google subject (account re-created or migrated from dev login): relink.
        user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is not null)
        {
            if (!info.EmailVerified)
            {
                throw new UnauthorizedException("auth.email_not_verified", "The Google account email is not verified.");
            }

            logger.LogInformation("Relinking user {UserId} to a new Google subject", user.Id);
            user.GoogleSubject = info.Subject;
            await db.SaveChangesAsync(ct);
            return (user, false);
        }

        var displayName = NormalizeDisplayName(info.Name, email);

        for (var attempt = 1; attempt <= PublicIdAttempts; attempt++)
        {
            var candidate = new User
            {
                PublicId = PublicIds.ForUser(displayName),
                GoogleSubject = info.Subject,
                Email = email,
                DisplayName = displayName,
                AvatarUrl = info.Picture,
                Status = UserStatus.Active,
            };

            db.Users.Add(candidate);
            try
            {
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Created user {PublicId}", candidate.PublicId);
                return (candidate, true);
            }
            catch (DbUpdateException) when (attempt < PublicIdAttempts)
            {
                // Either the public id collided or a concurrent login created the same account.
                db.Entry(candidate).State = EntityState.Detached;
                var existing = await db.Users.FirstOrDefaultAsync(u => u.GoogleSubject == info.Subject || u.Email == email, ct);
                if (existing is not null)
                {
                    return (existing, false);
                }
            }
        }

        throw new ConflictException("auth.user_create_failed", "Could not create the user account. Please try again.");
    }

    private async Task<AuthResponse> IssueAsync(User user, bool isNew, AuthContext context, CancellationToken ct)
    {
        var now = clock.UtcNow;
        var (raw, entity) = NewRefreshToken(user.Id, now, context);
        db.RefreshTokens.Add(entity);
        user.LastSeenAt = now;
        await db.SaveChangesAsync(ct);
        return BuildResponse(user, raw, entity, isNew);
    }

    private (string Raw, RefreshToken Entity) NewRefreshToken(long userId, DateTimeOffset now, AuthContext context)
    {
        var raw = RefreshTokens.GenerateRaw();
        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = RefreshTokens.Hash(raw),
            CreatedAt = now,
            ExpiresAt = now.AddDays(jwtOptions.Value.RefreshTokenDays),
            CreatedByIp = Truncate(context.IpAddress, 64),
            DeviceName = Truncate(context.DeviceName, 128),
        };
        return (raw, entity);
    }

    private AuthResponse BuildResponse(User user, string rawRefreshToken, RefreshToken entity, bool isNew)
    {
        var access = accessTokens.Create(user.Id, user.PublicId, user.DisplayName, user.Role.ToString());
        return new AuthResponse(access.Token, access.ExpiresAt, rawRefreshToken, entity.ExpiresAt, user.ToDto(), isNew);
    }

    private static void EnsureCanSignIn(User user)
    {
        if (user.Status == UserStatus.Banned)
        {
            throw new ForbiddenException("auth.account_banned", "This account has been banned.");
        }

        if (user.Status == UserStatus.Suspended)
        {
            throw new ForbiddenException("auth.account_suspended", "This account is temporarily suspended.");
        }
    }

    private static string NormalizeDisplayName(string? name, string email)
    {
        var value = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name.Trim();
        return value.Length <= 64 ? value : value[..64];
    }

    private static string? Truncate(string? value, int max) =>
        value is null || value.Length <= max ? value : value[..max];
}
