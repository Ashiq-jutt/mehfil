using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Moderation;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Mehfil.Infrastructure.Moderation;

public sealed class ReportService(MehfilDbContext db, IClock clock, ILogger<ReportService> logger) : IReportService
{
    public const int DetailsMax = 1000;

    public async Task<ReportDto> CreateAsync(long reporterId, CreateReportRequest request, CancellationToken ct)
    {
        if (!ReportReasons.IsValid(request.Reason))
        {
            throw new BadRequestException("reports.invalid_reason", "Choose one of the listed reasons.");
        }

        var (targetId, targetPublicId) = await ResolveTargetAsync(request.TargetType, request.TargetId, reporterId, ct);

        var duplicate = await db.Reports.AnyAsync(r =>
            r.ReporterId == reporterId && r.TargetType == request.TargetType && r.TargetId == targetId && r.Status == ReportStatus.Open, ct);
        if (duplicate)
        {
            throw new ConflictException("reports.duplicate", "You already reported this. Our team is reviewing it.");
        }

        var details = request.Details?.Trim();
        var report = new Report
        {
            ReporterId = reporterId,
            TargetType = request.TargetType,
            TargetId = targetId,
            Reason = request.Reason,
            Details = string.IsNullOrEmpty(details) ? null : details.Length <= DetailsMax ? details : details[..DetailsMax],
            Status = ReportStatus.Open,
            CreatedAt = clock.UtcNow,
        };

        db.Reports.Add(report);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("User {ReporterId} reported {TargetType} {TargetId} ({Reason})", reporterId, request.TargetType, targetPublicId, request.Reason);

        return new ReportDto(report.Id, report.TargetType, targetPublicId, report.Reason, report.Status, report.CreatedAt);
    }

    private async Task<(long Id, string PublicId)> ResolveTargetAsync(ReportTargetType type, string targetId, long reporterId, CancellationToken ct)
    {
        var id = targetId.Trim();
        switch (type)
        {
            case ReportTargetType.User:
            {
                var upper = id.ToUpperInvariant();
                var user = await db.Users.AsNoTracking().Where(u => u.PublicId == upper).Select(u => new { u.Id, u.PublicId }).FirstOrDefaultAsync(ct)
                           ?? throw NotFoundException.For("User", id);
                if (user.Id == reporterId)
                {
                    throw new BadRequestException("reports.self", "You cannot report yourself.");
                }

                return (user.Id, user.PublicId);
            }
            case ReportTargetType.Club:
            {
                var club = await db.Clubs.AsNoTracking().Where(c => c.PublicId == id).Select(c => new { c.Id, c.PublicId }).FirstOrDefaultAsync(ct)
                           ?? throw NotFoundException.For("Club", id);
                return (club.Id, club.PublicId);
            }
            case ReportTargetType.Message:
            {
                if (!long.TryParse(id, out var messageId))
                {
                    throw new BadRequestException("reports.invalid_target", "Message id must be numeric.");
                }

                var exists = await db.ClubMessages.AnyAsync(m => m.Id == messageId, ct);
                return exists ? (messageId, id) : throw NotFoundException.For("Message", id);
            }
            default:
                throw new BadRequestException("reports.invalid_target", "Unknown report target.");
        }
    }
}
