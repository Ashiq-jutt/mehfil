import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, Button, CloseButton, DialogCard, ErrorState, HeartsPill, Icon, LoadingState, Panel, Screen } from '../../components';
import { env } from '../../config/env';
import { useDevGrant, usePurchase, useShop, useWallet } from '../../hooks/useEconomy';
import type { MainStackScreenProps } from '../../navigation/types';
import { colors, moderateScale, palette, radius, shadows, spacing } from '../../theme';
import { formatCompact, formatNumber } from '../../utils/format';
import { formatPrice, giftEmoji } from './giftIcons';
import type { HeartsPackageDto, LedgerEntryDto } from '../../api/types';

/** Hearts shop: welcome offer, packs grid, history. */
export function ShopScreen({ navigation }: MainStackScreenProps<'Shop'>) {
  const shop = useShop();
  const purchase = usePurchase(shop.data?.sandboxMode ?? false);
  const devGrant = useDevGrant();
  const [history, setHistory] = useState(false);

  const welcome = shop.data?.packages.find(p => p.isWelcomeOffer && p.isAvailable);
  const packs = shop.data?.packages.filter(p => !p.isWelcomeOffer) ?? [];

  return (
    <Screen variant="flat">
      <View style={styles.topBar}>
        <HeartsPill value={shop.data?.balance ?? 0} />
        <AppText variant="title" color="textGold" shadow>
          Shop
        </AppText>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      {shop.isLoading && !shop.data ? <LoadingState /> : null}
      {shop.error && !shop.data ? <ErrorState title="Could not load the shop" actionLabel="Retry" onAction={() => shop.refetch()} /> : null}

      {shop.data ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={shop.isRefetching}
              onRefresh={() => {
                shop.refetch();
              }}
              tintColor={colors.accent}
            />
          }>
          <View style={styles.ribbonRow}>
            <View style={styles.ribbonLine} />
            <View style={styles.ribbon}>
              <AppText variant="label" shadow>
                HEARTS
              </AppText>
            </View>
            <View style={styles.ribbonLine} />
          </View>

          {welcome ? <WelcomeOffer pkg={welcome} busy={purchase.isPending} onBuy={() => purchase.mutate(welcome)} /> : null}

          <View style={styles.grid}>
            {packs.map(pkg => (
              <PackCard key={pkg.code} pkg={pkg} busy={purchase.isPending} onBuy={() => purchase.mutate(pkg)} />
            ))}
          </View>

          {shop.data.sandboxMode ? (
            <AppText variant="tiny" color="textMuted" align="center" style={styles.note}>
              Sandbox mode: purchases are simulated, no money is charged.
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Button label="Transaction history" variant="ghost" onPress={() => setHistory(true)} />
            {env.devLoginEnabled && shop.data.sandboxMode ? (
              <Button label="+1,000 hearts (dev)" variant="secondary" loading={devGrant.isPending} onPress={() => devGrant.mutate(1000)} />
            ) : null}
          </View>
        </ScrollView>
      ) : null}

      <HistoryDialog visible={history} onClose={() => setHistory(false)} />
    </Screen>
  );
}

function WelcomeOffer({ pkg, busy, onBuy }: { pkg: HeartsPackageDto; busy: boolean; onBuy: () => void }) {
  return (
    <LinearGradient colors={[palette.violet700, palette.violet900]} style={styles.welcome}>
      <View style={styles.valueTag}>
        <AppText variant="tiny" color="textOnGold">
          5X{'\n'}VALUE
        </AppText>
      </View>
      <AppText variant="heading" color="textGold" shadow align="center">
        WELCOME OFFER!
      </AppText>
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeHearts}>
          <Icon name="heart" size={moderateScale(40)} color={colors.hearts} />
          <AppText variant="title" shadow>
            {formatNumber(pkg.hearts)}
          </AppText>
        </View>
        {pkg.bonusGifts.map(b => (
          <View key={b.giftCode} style={styles.bonus}>
            <AppText variant="display">{giftEmoji(b.giftCode)}</AppText>
            <AppText variant="tiny" color="textGold">
              x{b.quantity}
            </AppText>
          </View>
        ))}
      </View>
      <Button label={formatPrice(pkg.priceMinor, pkg.currency)} loading={busy} onPress={onBuy} style={styles.welcomeBuy} />
    </LinearGradient>
  );
}

function PackCard({ pkg, busy, onBuy }: { pkg: HeartsPackageDto; busy: boolean; onBuy: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={busy} onPress={onBuy} style={({ pressed }) => [styles.pack, { opacity: pressed ? 0.9 : 1 }]}>
      <Panel variant="tile" padded={false} style={styles.packPanel}>
        <View style={styles.packBody}>
          {pkg.isBest ? (
            <View style={styles.best}>
              <AppText variant="tiny">BEST</AppText>
            </View>
          ) : null}
          <AppText variant="heading" shadow>
            {formatCompact(pkg.hearts)}
          </AppText>
          <Icon name="heart" size={moderateScale(34)} color={colors.hearts} />
          <View style={styles.royalty}>
            <AppText variant="tiny">{pkg.royaltyPoints} 👑</AppText>
          </View>
          <View style={styles.price}>
            <AppText variant="label" shadow>
              {formatPrice(pkg.priceMinor, pkg.currency)}
            </AppText>
          </View>
        </View>
      </Panel>
    </Pressable>
  );
}

function HistoryDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const wallet = useWallet(1);
  return (
    <DialogCard visible={visible} title="Transactions" onClose={onClose}>
      <View style={styles.historyList}>
        {wallet.isLoading ? <LoadingState /> : null}
        {wallet.data && wallet.data.ledger.items.length === 0 ? (
          <AppText variant="body" color="textMuted" align="center">
            No transactions yet.
          </AppText>
        ) : null}
        <FlatList
          data={wallet.data?.ledger.items ?? []}
          keyExtractor={e => String(e.id)}
          renderItem={({ item }) => <LedgerRow entry={item} />}
          ItemSeparatorComponent={Separator}
        />
      </View>
    </DialogCard>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntryDto }) {
  const positive = entry.delta > 0;
  return (
    <View style={styles.ledgerRow}>
      <View style={styles.ledgerText}>
        <AppText variant="label" numberOfLines={1}>
          {entry.note ?? entry.reason}
        </AppText>
        <AppText variant="tiny" color="textMuted">
          {new Date(entry.createdAt).toLocaleString()} · balance {formatNumber(entry.balanceAfter)}
        </AppText>
      </View>
      <AppText variant="label" color={positive ? 'online' : 'hearts'}>
        {positive ? '+' : ''}
        {formatNumber(entry.delta)}
      </AppText>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ribbonLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.borderStrong,
  },
  ribbon: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.xs,
  },
  welcome: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: palette.gold500,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  valueTag: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.gold400,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  welcomeHearts: {
    alignItems: 'center',
  },
  bonus: {
    alignItems: 'center',
  },
  welcomeBuy: {
    alignSelf: 'center',
    minWidth: moderateScale(180),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pack: {
    width: '30%',
    flexGrow: 1,
  },
  packPanel: {},
  packBody: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  best: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    borderTopLeftRadius: radius.md,
    borderBottomRightRadius: radius.xs,
  },
  royalty: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
  },
  price: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  note: {
    marginTop: spacing.lg,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  historyList: {
    maxHeight: moderateScale(380),
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ledgerText: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
