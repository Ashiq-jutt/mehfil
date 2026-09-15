using Mehfil.Core.Enums;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Mehfil.Infrastructure.Store;

public sealed record UserCosmetics(string? FrameCode, string? BubbleCode, string? EntryStyleCode);

/// <summary>Equipped-cosmetic lookups shared by the room, gift and message hydration paths.</summary>
public static class CosmeticsQueries
{
    public static async Task<Dictionary<long, UserCosmetics>> LoadUserCosmeticsAsync(this MehfilDbContext db, IReadOnlyCollection<long> userIds, CancellationToken ct)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<long, UserCosmetics>();
        }

        var rows = await db.UserItems.AsNoTracking()
            .Where(x => userIds.Contains(x.UserId) && x.IsEquipped &&
                        (x.Item.Kind == StoreItemKind.Frame || x.Item.Kind == StoreItemKind.ChatBubble || x.Item.Kind == StoreItemKind.EntryStyle))
            .Select(x => new { x.UserId, x.Item.Kind, x.Item.Code })
            .ToListAsync(ct);

        return rows.GroupBy(r => r.UserId).ToDictionary(
            g => g.Key,
            g => new UserCosmetics(
                g.FirstOrDefault(r => r.Kind == StoreItemKind.Frame)?.Code,
                g.FirstOrDefault(r => r.Kind == StoreItemKind.ChatBubble)?.Code,
                g.FirstOrDefault(r => r.Kind == StoreItemKind.EntryStyle)?.Code));
    }

    public static Task<string?> LoadItemCodeAsync(this MehfilDbContext db, long? itemId, CancellationToken ct) =>
        itemId is null
            ? Task.FromResult<string?>(null)
            : db.StoreItems.AsNoTracking().Where(i => i.Id == itemId.Value).Select(i => (string?)i.Code).FirstOrDefaultAsync(ct);
}
