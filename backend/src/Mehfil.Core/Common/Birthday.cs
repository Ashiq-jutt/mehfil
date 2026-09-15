namespace Mehfil.Core.Common;

public static class Birthday
{
    /// <summary>Day/month only (no year is collected). Feb 29 is allowed.</summary>
    public static bool IsValid(int day, int month) =>
        month is >= 1 and <= 12 && day >= 1 && day <= DateTime.DaysInMonth(2000, month);
}
