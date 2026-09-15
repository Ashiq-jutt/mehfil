using System.ComponentModel.DataAnnotations;

namespace Mehfil.Core.Options;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>Apply pending EF Core migrations on startup (Code First, auto DB creation).</summary>
    public bool AutoMigrate { get; set; } = true;

    /// <summary>Insert/refresh catalog seed data (countries, gifts, packages, store items) on startup.</summary>
    public bool SeedData { get; set; } = true;
}

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required, MinLength(32)]
    public string Secret { get; set; } = "";

    [Required]
    public string Issuer { get; set; } = "mehfil-api";

    [Required]
    public string Audience { get; set; } = "mehfil-app";

    [Range(1, 24 * 60)]
    public int AccessTokenMinutes { get; set; } = 15;

    [Range(1, 365)]
    public int RefreshTokenDays { get; set; } = 30;
}

public sealed class GoogleAuthOptions
{
    public const string SectionName = "Google";

    /// <summary>
    /// OAuth client IDs accepted as the ID token audience: the Web client ID used by the app
    /// plus the iOS client ID. Empty in dev disables audience validation (still validates signature).
    /// </summary>
    public string[] ClientIds { get; set; } = [];
}

public sealed class DevLoginOptions
{
    public const string SectionName = "DevLogin";

    /// <summary>
    /// When true (Development only), POST /auth/dev issues tokens for any email without Google.
    /// Never enable outside local development.
    /// </summary>
    public bool Enabled { get; set; }
}
