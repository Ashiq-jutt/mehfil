import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, CloseButton, EmptyState, ErrorState, HeartsPill, Screen } from '../../components';
import { useBuyItem, useEquipItem, useStoreItems } from '../../hooks/useClubStore';
import { useMe } from '../../hooks/useMe';
import type { MainStackScreenProps } from '../../navigation/types';
import { colors, gradients, moderateScale, palette, radius, shadows, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { KindTabs } from './KindTabs';
import { StoreItemCard } from './StoreItemCard';
import { StoreGridSkeleton } from './StoreGridSkeleton';
import { StoreItemPreviewDialog } from './StoreItemPreviewDialog';
import type { StoreItemDto, StoreItemKind } from '../../api/types';

/** Club Store: frames · chat bubbles · entry styles · backgrounds · cards · club DPs with unlock rules and previews. */
export function ClubStoreScreen({ navigation, route }: MainStackScreenProps<'ClubStore'>) {
  const store = useStoreItems();
  const equip = useEquipItem();
  const buy = useBuyItem();
  const { user } = useMe();
  const [kind, setKind] = useState<StoreItemKind>(route.params?.kind ?? 'Frame');
  const [preview, setPreview] = useState<string | null>(null);

  const items = useMemo(() => store.data?.items.filter(i => i.kind === kind) ?? [], [store.data, kind]);
  const avatarUri = resolveAssetUrl(user?.avatarUrl);
  const busy = equip.isPending || buy.isPending;
  const needsClub = (kind === 'Background' || kind === 'ClubDp') && store.data && !store.data.clubId;

  const onUse = (item: StoreItemDto) => equip.mutate(item.code, { onSuccess: () => setPreview(null) });
  const onBuy = (item: StoreItemDto) => buy.mutate(item.code);

  return (
    <Screen variant="flat">
      <View style={styles.topBar}>
        <HeartsPill value={store.data?.balance ?? user?.heartsBalance ?? 0} onPressAdd={() => navigation.navigate('Shop')} />
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      <LinearGradient colors={gradients.ribbon} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.banner}>
        <View style={[styles.ornament, styles.ornamentLeft]} />
        <AppText variant="title" color="textGold" shadow uppercase>
          Club Store
        </AppText>
        <View style={[styles.ornament, styles.ornamentRight]} />
      </LinearGradient>

      <KindTabs kinds={store.data?.kinds ?? []} active={kind} onChange={setKind} />

      {store.isLoading && !store.data ? <StoreGridSkeleton /> : null}
      {store.error && !store.data ? <ErrorState title="Could not load the store" actionLabel="Retry" onAction={() => store.refetch()} /> : null}

      {store.data ? (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={item => item.code}
          renderItem={({ item }) => <StoreItemCard item={item} avatarUri={avatarUri} busy={busy} onPress={it => setPreview(it.code)} onUse={onUse} />}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={
            needsClub ? (
              <View style={styles.note}>
                <AppText variant="caption" color="textSecondary" align="center">
                  Backgrounds and club DPs apply to your own club. Create one from the My tab to use them.
                </AppText>
              </View>
            ) : undefined
          }
          ListEmptyComponent={<EmptyState icon="store" title="Nothing here yet" />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={store.isRefetching}
              onRefresh={() => {
                store.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        />
      ) : null}

      <StoreItemPreviewDialog
        visible={preview !== null}
        items={items}
        initialCode={preview}
        avatarUri={avatarUri}
        clubLevel={store.data?.clubLevel ?? 0}
        busy={busy}
        onClose={() => setPreview(null)}
        onUse={onUse}
        onBuy={onBuy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  banner: {
    marginHorizontal: spacing.xxxl,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: palette.gold500,
    alignItems: 'center',
    ...shadows.card,
  },
  ornament: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: moderateScale(10),
    backgroundColor: palette.gold500,
    borderRadius: 3,
  },
  ornamentLeft: {
    left: -moderateScale(8),
  },
  ornamentRight: {
    right: -moderateScale(8),
  },
  grid: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  column: {
    gap: spacing.md,
  },
  note: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
});
