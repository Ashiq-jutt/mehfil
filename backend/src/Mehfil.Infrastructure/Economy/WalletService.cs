using System.Text.Json;
using Mehfil.Core.Common;
using Mehfil.Core.Economy;
using Mehfil.Core.Entities;
using Mehfil.Core.Enums;
using Mehfil.Core.Options;
using Mehfil.Core.Royalty;
using Mehfil.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Economy;

public sealed class WalletService(
    MehfilDbContext db,
    IStoreReceiptVerifier verifier,
    IOptions<DevLoginOptions> devLogin,
    IHostEnvironment environment,
    IClock clock,
    ILogger<WalletService> logger) : IWalletService
{
    public const long DevGrantMax = 1_000_000;

    public async Task<WalletDto> GetAsync(long userId, int? page, int? pageSize, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Where(u => u.Id == userId)
                       .Select(u => new { u.HeartsBalance, u.HeartsGifted, u.HeartsReceived, u.RoyaltyPoints }).FirstOrDefaultAsync(ct)
                   ?? throw NotFoundException.For("User", userId);

        var (p, size) = Paging.Normalize(page, pageSize);
        var query = db.WalletLedger.AsNoTracking().Where(l => l.UserId == userId);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(l => l.Id).Skip((p - 1) * size).Take(size)
            .Select(l => new LedgerEntryDto(l.Id, l.Delta, l.BalanceAfter, l.Reason, l.Note, l.CreatedAt))
            .ToListAsync(ct);

        return new WalletDto(user.HeartsBalance, user.HeartsGifted, user.HeartsReceived, user.RoyaltyPoints, new PagedResult<LedgerEntryDto>(items, p, size, total));
    }

    public async Task<ShopDto> GetShopAsync(long userId, CancellationToken ct)
    {
        var balance = await db.Users.Where(u => u.Id == userId).Select(u => u.HeartsBalance).FirstOrDefaultAsync(ct);
        var packages = await db.HeartsPackages.AsNoTracking().Where(p => p.IsActive).OrderBy(p => p.SortOrder).ToListAsync(ct);
        var welcomeUsed = await db.Purchases.AnyAsync(p => p.UserId == userId && p.Package.IsWelcomeOffer && p.Status == PurchaseStatus.Verified, ct);
        var gifts = await db.Gifts.AsNoTracking().ToDictionaryAsync(g => g.Code, g => g.Name, ct);

        var list = packages.Select(p => new HeartsPackageDto(
            p.Code, p.Name, p.Hearts, p.PriceMinor, p.Currency, p.RoyaltyPoints, p.IconUrl,
            p.StoreProductIdAndroid, p.StoreProductIdIos, p.IsBest, p.IsWelcomeOffer,
            ParseBonus(p.BonusGiftsJson, gifts),
            !(p.IsWelcomeOffer && welcomeUsed))).ToList();

        return new ShopDto(balance, verifier.IsSandbox, list);
    }

    public async Task<PurchaseResultDto> VerifyPurchaseAsync(long userId, VerifyPurchaseRequest request, CancellationToken ct)
    {
        var transactionId = request.TransactionId.Trim();
        var existing = await db.Purchases.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Platform == request.Platform && p.StoreTransactionId == transactionId, ct);
        if (existing is not null)
        {
            if (existing.UserId != userId)
            {
                throw new ConflictException("purchases.transaction_used", "This transaction belongs to another account.");
            }

            var u = await db.Users.AsNoTracking().FirstAsync(x => x.Id == userId, ct);
            return new PurchaseResultDto(existing.Id, existing.Status, existing.HeartsGranted, u.HeartsBalance, u.RoyaltyPoints, u.RoyalLevel, u.PrimeLevel, true);
        }

        var package = await db.HeartsPackages.FirstOrDefaultAsync(p => p.IsActive &&
                          (p.Code == request.ProductId || p.StoreProductIdAndroid == request.ProductId || p.StoreProductIdIos == request.ProductId), ct)
                      ?? throw new BadRequestException("purchases.unknown_product", $"Unknown product '{request.ProductId}'.");

        if (package.IsWelcomeOffer)
        {
            var used = await db.Purchases.AnyAsync(p => p.UserId == userId && p.PackageId == package.Id && p.Status == PurchaseStatus.Verified, ct);
            if (used)
            {
                throw new ConflictException("purchases.welcome_used", "The welcome offer can be bought only once.");
            }
        }

        var verified = await verifier.VerifyAsync(request.Platform, request.ProductId, transactionId, request.Receipt, ct);
        var now = clock.UtcNow;
        var purchase = new Purchase
        {
            UserId = userId,
            PackageId = package.Id,
            Platform = request.Platform,
            StoreTransactionId = transactionId,
            Status = verified ? PurchaseStatus.Verified : PurchaseStatus.Rejected,
            RawReceipt = request.Receipt is { Length: > 0 } r ? (r.Length <= 8000 ? r : r[..8000]) : null,
            CreatedAt = now,
            VerifiedAt = verified ? now : null,
        };
        db.Purchases.Add(purchase);

        if (!verified)
        {
            await db.SaveChangesAsync(ct);
            throw new BadRequestException("purchases.rejected", "The store did not confirm this purchase.");
        }

        var user = await CreditAsync(userId, package.Hearts, LedgerReason.Purchase, $"{package.Name}", purchase, package.RoyaltyPoints, ct);
        await GrantBonusGiftsAsync(user, package, ct);
        logger.LogInformation("User {UserId} purchased {Package} ({Hearts} hearts, {Platform})", userId, package.Code, package.Hearts, request.Platform);

        return new PurchaseResultDto(purchase.Id, purchase.Status, purchase.HeartsGranted, user.HeartsBalance, user.RoyaltyPoints, user.RoyalLevel, user.PrimeLevel, false);
    }

    public async Task<WalletDto> DevGrantAsync(long userId, long hearts, CancellationToken ct)
    {
        if (!devLogin.Value.Enabled || !environment.IsDevelopment())
        {
            throw new NotFoundException("wallet.dev_grant_disabled", "Not available.");
        }

        if (hearts is <= 0 or > DevGrantMax)
        {
            throw new BadRequestException("wallet.invalid_amount", $"Hearts must be between 1 and {DevGrantMax}.");
        }

        await CreditAsync(userId, hearts, LedgerReason.AdminAdjustment, "Developer grant", null, 0, ct);
        return await GetAsync(userId, 1, 20, ct);
    }

    // ------------------------------------------------------------------

    private async Task<User> CreditAsync(long userId, long hearts, LedgerReason reason, string note, Purchase? purchase, int royaltyPoints, CancellationToken ct)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw NotFoundException.For("User", userId);
            user.HeartsBalance += hearts;
            if (royaltyPoints > 0)
            {
                user.RoyaltyPoints += royaltyPoints;
                var (royal, prime) = RoyaltyLevels.Compute(user.RoyaltyPoints);
                user.RoyalLevel = royal;
                user.PrimeLevel = prime;
                if (royal > user.HighestRoyalLevel)
                {
                    user.HighestRoyalLevel = royal;
                }
            }

            if (purchase is not null)
            {
                purchase.HeartsGranted = hearts;
            }

            db.WalletLedger.Add(new WalletLedger
            {
                UserId = userId,
                Delta = hearts,
                BalanceAfter = user.HeartsBalance,
                Reason = reason,
                ReferenceId = purchase?.Id,
                Note = note,
                CreatedAt = clock.UtcNow,
            });

            try
            {
                await db.SaveChangesAsync(ct);
                return user;
            }
            catch (DbUpdateConcurrencyException) when (attempt < 2)
            {
                foreach (var entry in db.ChangeTracker.Entries().Where(e => e.Entity is User or WalletLedger).ToList())
                {
                    if (entry.Entity is WalletLedger) entry.State = EntityState.Detached; else await entry.ReloadAsync(ct);
                }
            }
        }

        throw new ConflictException("wallet.busy", "Your wallet is busy. Please try again.");
    }

    private async Task GrantBonusGiftsAsync(User user, HeartsPackage package, CancellationToken ct)
    {
        // Bonus gifts are credited as their hearts value so they can be sent as any gift later.
        var bonus = ParseBonus(package.BonusGiftsJson, await db.Gifts.AsNoTracking().ToDictionaryAsync(g => g.Code, g => g.Name, ct));
        if (bonus.Count == 0)
        {
            return;
        }

        var prices = await db.Gifts.AsNoTracking().ToDictionaryAsync(g => g.Code, g => g.HeartsPrice, ct);
        var value = bonus.Sum(b => prices.GetValueOrDefault(b.GiftCode) * b.Quantity);
        if (value > 0)
        {
            await CreditAsync(user.Id, value, LedgerReason.WelcomeBonus, "Welcome offer bonus gifts", null, 0, ct);
        }
    }

    private static IReadOnlyList<BonusGiftDto> ParseBonus(string? json, IReadOnlyDictionary<string, string> names)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            var rows = JsonSerializer.Deserialize<List<BonusRow>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
            return rows.Where(r => r.GiftCode is not null).Select(r => new BonusGiftDto(r.GiftCode!, names.GetValueOrDefault(r.GiftCode!, r.GiftCode!), r.Qty)).ToList();
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private sealed record BonusRow(string? GiftCode, int Qty);
}

/// <summary>Accepts every receipt. Only registered when Purchases:SandboxMode is true.</summary>
public sealed class SandboxReceiptVerifier : IStoreReceiptVerifier
{
    public bool IsSandbox => true;

    public Task<bool> VerifyAsync(DevicePlatform platform, string productId, string transactionId, string? receipt, CancellationToken ct) =>
        Task.FromResult(!string.IsNullOrWhiteSpace(transactionId));
}

/// <summary>Placeholder until Google Play / App Store server verification is configured.</summary>
public sealed class UnconfiguredReceiptVerifier : IStoreReceiptVerifier
{
    public bool IsSandbox => false;

    public Task<bool> VerifyAsync(DevicePlatform platform, string productId, string transactionId, string? receipt, CancellationToken ct) =>
        throw new AppUnavailableException("purchases.not_configured", "Store purchase verification is not configured on this server.");
}

public sealed class PurchasesOptions
{
    public const string SectionName = "Purchases";

    /// <summary>Accept purchases without store verification (development / QA only).</summary>
    public bool SandboxMode { get; set; }
}
