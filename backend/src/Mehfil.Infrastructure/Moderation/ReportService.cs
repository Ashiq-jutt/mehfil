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

    public async Task<PagedResult<AdminReportDto>> ListForAdminAsync(ReportStatus? status, int? page, int? pageSize, CancellationToken ct)
    {
        var p = Math.Max(1, page ?? 1);
        var size = Math.Clamp(pageSize ?? 20, 1, 100);
        var query = db.Reports.AsNoTracking();
        if (status is not null)
        {
            query = query.Where(r => r.Status == status);
        }

        var total = await query.LongCountAsync(ct);
        var rows = await query.OrderBy(r => r.Status).ThenByDescending(r => r.Id).Skip((p - 1) * size).Take(size).Include(r => r.Reporter).ToListAsync(ct);
        var items = new List<AdminReportDto>(rows.Count);
        foreach (var row in rows)
        {
            items.Add(await ToAdminDtoAsync(row, ct));
        }

        return new PagedResult<AdminReportDto>(items, p, size, total);
    }

    public async Task<AdminReportDto> ResolveAsync(long adminId, long reportId, ResolveReportRequest request, CancellationToken ct)
    {
        if (request.Status == ReportStatus.Open)
        {
            throw new BadRequestException("reports.invalid_status", "Choose Reviewed, ActionTaken or Dismissed.");
        }

        if (request.Action is not null && !ReportActions.All.Contains(request.Action))
        {
            throw new BadRequestException("reports.invalid_action", $"Action must be one of: {string.Join(", ", ReportActions.All)}.");
        }

        var report = await db.Reports.Include(r => r.Reporter).FirstOrDefaultAsync(r => r.Id == reportId, ct) ?? throw NotFoundException.For("Report", reportId);
        if (request.Action is not null)
        {
            await ApplyActionAsync(report, request.Action, ct);
        }

        report.Status = request.Action is not null ? ReportStatus.ActionTaken : request.Status;
        report.ResolvedAt = clock.UtcNow;
        report.ResolvedByUserId = adminId;
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Admin {AdminId} resolved report {ReportId} as {Status} ({Action})", adminId, reportId, report.Status, request.Action ?? "none");
        return await ToAdminDtoAsync(report, ct);
    }

    private async Task ApplyActionAsync(Report report, string action, CancellationToken ct)
    {
        switch (action)
        {
            case ReportActions.SuspendUser or ReportActions.BanUser when report.TargetType == ReportTargetType.User:
            {
                var user = await db.Users.FirstOrDefaultAsync(u => u.Id == report.TargetId, ct) ?? throw NotFoundException.For("User", report.TargetId);
                user.Status = action == ReportActions.BanUser ? UserStatus.Banned : UserStatus.Suspended;
                await db.RefreshTokens.Where(t => t.UserId == user.Id && t.RevokedAt == null).ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, clock.UtcNow), ct);
                break;
            }
            case ReportActions.DeactivateClub when report.TargetType == ReportTargetType.Club:
            {
                var club = await db.Clubs.FirstOrDefaultAsync(c => c.Id == report.TargetId, ct) ?? throw NotFoundException.For("Club", report.TargetId);
                club.IsActive = false;
                break;
            }
            case ReportActions.DeleteMessage when report.TargetType == ReportTargetType.Message:
            {
                var message = await db.ClubMessages.FirstOrDefaultAsync(m => m.Id == report.TargetId, ct) ?? throw NotFoundException.For("Message", report.TargetId);
                message.IsDeleted = true;
                break;
            }
            default:
                throw new BadRequestException("reports.action_mismatch", $"Action '{action}' does not apply to a {report.TargetType} report.");
        }
    }

    private async Task<AdminReportDto> ToAdminDtoAsync(Report report, CancellationToken ct)
    {
        var (publicId, name) = report.TargetType switch
        {
            ReportTargetType.User => await db.Users.AsNoTracking().Where(u => u.Id == report.TargetId).Select(u => new ValueTuple<string, string>(u.PublicId, u.DisplayName)).FirstOrDefaultAsync(ct),
            ReportTargetType.Club => await db.Clubs.AsNoTracking().Where(c => c.Id == report.TargetId).Select(c => new ValueTuple<string, string>(c.PublicId, c.Name)).FirstOrDefaultAsync(ct),
            _ => await db.ClubMessages.AsNoTracking().Where(m => m.Id == report.TargetId).Select(m => new ValueTuple<string, string>(m.Id.ToString(), m.Text)).FirstOrDefaultAsync(ct),
        };

        return new AdminReportDto(
            report.Id, report.TargetType, publicId ?? report.TargetId.ToString(), name ?? "(gone)", report.Reason, report.Details, report.Status,
            report.Reporter.PublicId, report.Reporter.DisplayName, report.CreatedAt, report.ResolvedAt);
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
