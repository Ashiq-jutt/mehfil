using Mehfil.Core.Enums;

namespace Mehfil.Core.Moderation;

public sealed record ReportReasonDto(string Code, string Label);

public static class ReportReasons
{
    public static readonly IReadOnlyList<ReportReasonDto> All =
    [
        new("obscenity", "Obscene or sexual content"),
        new("propaganda", "Fake information or extremism"),
        new("bullying", "Bullying or harassment"),
        new("trade", "Selling or trading accounts / hearts"),
        new("spam", "Spam or scam"),
        new("impersonation", "Impersonating someone"),
        new("other", "Something else"),
    ];

    public static bool IsValid(string code) => All.Any(r => r.Code == code);
}

/// <summary>TargetId is the public id (user / club) or the numeric message id.</summary>
public sealed record CreateReportRequest(ReportTargetType TargetType, string TargetId, string Reason, string? Details);

public sealed record ReportDto(long Id, ReportTargetType TargetType, string TargetId, string Reason, ReportStatus Status, DateTimeOffset CreatedAt);

/// <summary>Moderation queue row (admins / moderators only).</summary>
public sealed record AdminReportDto(
    long Id,
    ReportTargetType TargetType,
    string TargetId,
    string TargetName,
    string Reason,
    string? Details,
    ReportStatus Status,
    string ReporterId,
    string ReporterName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ResolvedAt);

/// <summary>Actions a moderator can apply while closing a report.</summary>
public static class ReportActions
{
    public const string SuspendUser = "suspend_user";
    public const string BanUser = "ban_user";
    public const string DeactivateClub = "deactivate_club";
    public const string DeleteMessage = "delete_message";

    public static readonly IReadOnlyList<string> All = [SuspendUser, BanUser, DeactivateClub, DeleteMessage];
}

public sealed record ResolveReportRequest(ReportStatus Status, string? Action);

public interface IReportService
{
    /// <summary>Creates a report. 404 for unknown targets, 409 while the reporter already has an open report on the same target.</summary>
    Task<ReportDto> CreateAsync(long reporterId, CreateReportRequest request, CancellationToken ct);

    Task<Common.PagedResult<AdminReportDto>> ListForAdminAsync(ReportStatus? status, int? page, int? pageSize, CancellationToken ct);

    /// <summary>Closes a report with a status and an optional enforcement action on its target.</summary>
    Task<AdminReportDto> ResolveAsync(long adminId, long reportId, ResolveReportRequest request, CancellationToken ct);
}

public sealed record BlockedUserDto(string Id, string DisplayName, string? AvatarUrl, DateTimeOffset BlockedAt);

public interface IBlockService
{
    Task<IReadOnlyList<BlockedUserDto>> ListAsync(long userId, CancellationToken ct);
    Task<IReadOnlyList<BlockedUserDto>> BlockAsync(long userId, string targetPublicId, CancellationToken ct);
    Task<IReadOnlyList<BlockedUserDto>> UnblockAsync(long userId, string targetPublicId, CancellationToken ct);

    /// <summary>True when either user has blocked the other.</summary>
    Task<bool> IsBlockedEitherWayAsync(long a, long b, CancellationToken ct);
}
