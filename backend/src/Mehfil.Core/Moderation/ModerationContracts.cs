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

public interface IReportService
{
    /// <summary>Creates a report. 404 for unknown targets, 409 while the reporter already has an open report on the same target.</summary>
    Task<ReportDto> CreateAsync(long reporterId, CreateReportRequest request, CancellationToken ct);
}
