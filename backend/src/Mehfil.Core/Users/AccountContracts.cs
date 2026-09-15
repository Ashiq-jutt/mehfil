namespace Mehfil.Core.Users;

public interface IAccountService
{
    /// <summary>
    /// Soft-deletes the account: anonymises identity fields, revokes sessions and device tokens, deactivates owned clubs
    /// and frees any seat. Ledger, gifts and reports stay for audit under the anonymised user.
    /// </summary>
    Task DeleteAsync(long userId, CancellationToken ct);
}
