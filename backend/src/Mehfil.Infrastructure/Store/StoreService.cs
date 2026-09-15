using Mehfil.Core.Common;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Store;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Mehfil.Infrastructure.Store;

public sealed class StoreService(MehfilDbContext db, IClock clock) : IStoreService
{
    public async Task<StoreDto> GetAsync(long userId, CancellationToken ct)
    {
        var ctx = await LoadContextAsync(userId, ct);
        var items = await db.StoreItems.AsNoTracking().Where(i => i.IsActive).OrderBy(i => i.Kind).ThenBy(i => i.SortOrder).ToListAsync(ct);
        var now = clock.UtcNow;

        // Which item is equipped per kind; a kind with nothing equipped falls back to its default item.
        var equippedByKind = new Dictionary<StoreItemKind, long>();
        foreach (var row in ctx.UserItems.Values.Where(x => x.IsEquipped))
        {
            var kind = items.FirstOrDefault(i => i.Id == row.ItemId)?.Kind;
            if (kind is not null)
            {
                equippedByKind[kind.Value] = row.ItemId;
            }
        }

        if (ctx.Club?.BackgroundItemId is { } bg)
        {
            equippedByKind[StoreItemKind.Background] = bg;
        }

        if (ctx.Club?.DpItemId is { } dp)
        {
            equippedByKind[StoreItemKind.ClubDp] = dp;
        }

        var dtos = new List<StoreItemDto>(items.Count);
        foreach (var item in items)
        {
            var clubKind = StoreRules.IsClubKind(item.Kind);
            DateTimeOffset? acquiredAt = null;
            var everEquipped = false;
            var ownedExplicitly = false;
            if (clubKind)
            {
                if (ctx.ClubItems.TryGetValue(item.Id, out var ci))
                {
                    ownedExplicitly = true;
                    acquiredAt = ci.AcquiredAt;
                    everEquipped = ci.IsEquipped;
                }
            }
            else if (ctx.UserItems.TryGetValue(item.Id, out var ui))
            {
                ownedExplicitly = true;
                acquiredAt = ui.AcquiredAt;
                everEquipped = ui.IsEquipped;
            }

            var unlocked = StoreRules.IsUnlocked(item.UnlockRule, item.UnlockValue, ownedExplicitly, ctx.User.HighestRoyalLevel, ctx.User.PrimeLevel, ctx.Club?.Level ?? 0);
            var isDefault = StoreRules.IsDefaultItem(item.UnlockRule, item.Code);
            var equipped = equippedByKind.TryGetValue(item.Kind, out var equippedId) ? equippedId == item.Id : isDefault;
            var purchasable = item.UnlockRule == UnlockRule.Purchase && item.HeartsPrice is not null;

            dtos.Add(new StoreItemDto(
                item.Code, item.Kind, item.Name, item.AssetUrl, item.PreviewUrl,
                item.UnlockRule, item.UnlockValue, item.UnlockBoard, item.UnlockLabel, item.HeartsPrice,
                IsOwned: unlocked,
                IsEquipped: equipped,
                IsLocked: !unlocked && !purchasable,
                LockReason: unlocked ? null : item.UnlockLabel ?? "Locked",
                IsNew: StoreRules.IsNew(acquiredAt, everEquipped || equipped, now)));
        }

        var kinds = Enum.GetValues<StoreItemKind>()
            .Select(k => new StoreKindDto(k, dtos.Count(d => d.Kind == k), dtos.Count(d => d.Kind == k && d.IsNew)))
            .ToList();

        return new StoreDto(ctx.User.HeartsBalance, ctx.Club?.PublicId, ctx.Club?.Name, ctx.Club?.Level ?? 0, ctx.User.HighestRoyalLevel, ctx.User.PrimeLevel, kinds, dtos);
    }

    public async Task<EquipResultDto> EquipAsync(long userId, string code, CancellationToken ct)
    {
        var item = await db.StoreItems.AsNoTracking().FirstOrDefaultAsync(i => i.Code == code && i.IsActive, ct)
                   ?? throw NotFoundException.For("Store item", code);
        var ctx = await LoadContextAsync(userId, ct, track: true);
        var clubKind = StoreRules.IsClubKind(item.Kind);
        var ownedExplicitly = clubKind ? ctx.ClubItems.ContainsKey(item.Id) : ctx.UserItems.ContainsKey(item.Id);
        if (!StoreRules.IsUnlocked(item.UnlockRule, item.UnlockValue, ownedExplicitly, ctx.User.HighestRoyalLevel, ctx.User.PrimeLevel, ctx.Club?.Level ?? 0))
        {
            throw new ConflictException("store.locked", item.UnlockLabel is null ? "This item is locked." : $"Locked: {item.UnlockLabel}.");
        }

        var isDefault = StoreRules.IsDefaultItem(item.UnlockRule, item.Code);
        var now = clock.UtcNow;

        if (clubKind)
        {
            var club = ctx.Club ?? throw new BadRequestException("store.no_club", "Create a club to use backgrounds and club DPs.");
            if (!isDefault && !ctx.ClubItems.ContainsKey(item.Id))
            {
                db.ClubItems.Add(new ClubItem { ClubId = club.Id, ItemId = item.Id, AcquiredAt = now, IsEquipped = true });
            }

            foreach (var row in ctx.ClubItems.Values)
            {
                row.IsEquipped = row.ItemId == item.Id;
            }

            if (item.Kind == StoreItemKind.Background)
            {
                club.BackgroundItemId = isDefault ? null : item.Id;
            }
            else
            {
                club.DpItemId = isDefault ? null : item.Id;
            }
        }
        else
        {
            var kindItemIds = await db.StoreItems.AsNoTracking().Where(i => i.Kind == item.Kind).Select(i => i.Id).ToListAsync(ct);
            foreach (var row in ctx.UserItems.Values.Where(x => kindItemIds.Contains(x.ItemId)))
            {
                row.IsEquipped = row.ItemId == item.Id;
            }

            if (!isDefault && !ctx.UserItems.ContainsKey(item.Id))
            {
                db.UserItems.Add(new UserItem { UserId = userId, ItemId = item.Id, AcquiredAt = now, IsEquipped = true });
            }
        }

        await db.SaveChangesAsync(ct);
        return new EquipResultDto(item.Kind, isDefault ? null : item.Code);
    }

    public async Task<BuyResultDto> BuyAsync(long userId, string code, CancellationToken ct)
    {
        var item = await db.StoreItems.AsNoTracking().FirstOrDefaultAsync(i => i.Code == code && i.IsActive, ct)
                   ?? throw NotFoundException.For("Store item", code);
        if (item.UnlockRule != UnlockRule.Purchase || item.HeartsPrice is null)
        {
            throw new BadRequestException("store.not_purchasable", "This item cannot be bought with hearts.");
        }

        var ctx = await LoadContextAsync(userId, ct);
        var clubKind = StoreRules.IsClubKind(item.Kind);
        if (clubKind && ctx.Club is null)
        {
            throw new BadRequestException("store.no_club", "Create a club to buy backgrounds and club DPs.");
        }

        if (clubKind ? ctx.ClubItems.ContainsKey(item.Id) : ctx.UserItems.ContainsKey(item.Id))
        {
            throw new ConflictException("store.already_owned", "You already own this item.");
        }

        var price = item.HeartsPrice.Value;
        var now = clock.UtcNow;
        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            var debited = await db.Users.Where(u => u.Id == userId && u.HeartsBalance >= price)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.HeartsBalance, u => u.HeartsBalance - price), ct);
            if (debited == 0)
            {
                throw new ConflictException("store.insufficient_hearts", "Not enough hearts. Top up in the Shop.");
            }

            var balance = await db.Users.Where(u => u.Id == userId).Select(u => u.HeartsBalance).FirstAsync(ct);
            if (clubKind)
            {
                db.ClubItems.Add(new ClubItem { ClubId = ctx.Club!.Id, ItemId = item.Id, AcquiredAt = now });
            }
            else
            {
                db.UserItems.Add(new UserItem { UserId = userId, ItemId = item.Id, AcquiredAt = now });
            }

            db.WalletLedger.Add(new WalletLedger
            {
                UserId = userId, Delta = -price, BalanceAfter = balance, Reason = LedgerReason.StorePurchase, ReferenceId = item.Id, Note = item.Name, CreatedAt = now,
            });
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return new BuyResultDto(item.Code, balance);
        });
    }

    // ------------------------------------------------------------------

    private sealed record Context(User User, Club? Club, Dictionary<long, UserItem> UserItems, Dictionary<long, ClubItem> ClubItems);

    private async Task<Context> LoadContextAsync(long userId, CancellationToken ct, bool track = false)
    {
        IQueryable<User> users = track ? db.Users : db.Users.AsNoTracking();
        IQueryable<Club> clubs = track ? db.Clubs : db.Clubs.AsNoTracking();
        IQueryable<UserItem> userItems = track ? db.UserItems : db.UserItems.AsNoTracking();
        IQueryable<ClubItem> clubItems = track ? db.ClubItems : db.ClubItems.AsNoTracking();

        var user = await users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw NotFoundException.For("User", userId);
        var club = await clubs.FirstOrDefaultAsync(c => c.OwnerId == userId && c.IsActive, ct);
        var owned = await userItems.Where(x => x.UserId == userId).ToDictionaryAsync(x => x.ItemId, ct);
        var clubOwned = club is null
            ? new Dictionary<long, ClubItem>()
            : await clubItems.Where(x => x.ClubId == club.Id).ToDictionaryAsync(x => x.ItemId, ct);
        return new Context(user, club, owned, clubOwned);
    }
}
