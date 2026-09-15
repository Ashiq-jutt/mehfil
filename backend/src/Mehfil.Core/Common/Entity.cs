namespace Mehfil.Core.Common;

/// <summary>Base class for entities with a surrogate identity key.</summary>
public abstract class Entity
{
    public long Id { get; set; }
}

/// <summary>Entity that tracks creation and last-update timestamps (set automatically on save).</summary>
public abstract class AuditableEntity : Entity
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
