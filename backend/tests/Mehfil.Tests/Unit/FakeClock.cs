using Mehfil.Core.Common;

namespace Mehfil.Tests.Unit;

public sealed class FakeClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset UtcNow { get; set; } = now;
}
