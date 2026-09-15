using Mehfil.Core.Common;
using Mehfil.Core.Enums;

namespace Mehfil.Core.Entities;

public class Report : Entity
{
    public long ReporterId { get; set; }
    public ReportTargetType TargetType { get; set; }
    public long TargetId { get; set; }
    public required string Reason { get; set; }
    public string? Details { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public long? ResolvedByUserId { get; set; }

    public User Reporter { get; set; } = null!;
}

public class Block
{
    public long BlockerId { get; set; }
    public long BlockedId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User Blocker { get; set; } = null!;
    public User Blocked { get; set; } = null!;
}

public class Notification : Entity
{
    public long UserId { get; set; }
    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }

    /// <summary>Optional deep-link payload as JSON (e.g. {"clubId": "29451765"}).</summary>
    public string? DataJson { get; set; }

    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
