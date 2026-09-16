import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, Icon } from '../../components';
import { colors, gradients, moderateScale, palette, radius, spacing } from '../../theme';
import { formatNumber } from '../../utils/format';
import { StoreItemVisual } from './StoreItemVisual';
import type { StoreItemDto } from '../../api/types';

type Props = {
  item: StoreItemDto;
  avatarUri?: string;
  busy?: boolean;
  onPress: (item: StoreItemDto) => void;
  onUse: (item: StoreItemDto) => void;
};

/** Grid tile: selected (green, check) · Use · locked with reason · buy with hearts. */
export function StoreItemCard({ item, avatarUri, busy = false, onPress, onUse }: Props) {
  const state = item.isEquipped ? 'equipped' : item.isOwned ? 'owned' : item.isLocked ? 'locked' : 'buy';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.isEquipped ? ', selected' : item.isLocked ? `, locked: ${item.lockReason}` : ''}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient colors={gradients.tile} style={[styles.panel, state === 'equipped' ? styles.panelSelected : null]}>
        {item.isNew ? (
          <View style={styles.newRibbon}>
            <AppText variant="tiny" color="textOnGold">
              NEW
            </AppText>
          </View>
        ) : null}
        <View style={styles.visual}>
          <StoreItemVisual code={item.code} kind={item.kind} size={moderateScale(92)} avatarUri={avatarUri} />
        </View>
        <AppText variant="tiny" numberOfLines={1} align="center" style={styles.name}>
          {item.name}
        </AppText>

        {state === 'equipped' ? (
          <View style={[styles.footer, styles.footerSelected]}>
            <Icon name="check" size={moderateScale(16)} color={colors.white} strokeWidth={3} />
          </View>
        ) : null}
        {state === 'owned' ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Use ${item.name}`} disabled={busy} onPress={() => onUse(item)} style={[styles.footer, styles.footerUse]} hitSlop={4}>
            <AppText variant="label" shadow>
              Use
            </AppText>
          </Pressable>
        ) : null}
        {state === 'locked' ? (
          <View style={[styles.footer, styles.footerLocked]}>
            <Icon name="lock" size={moderateScale(12)} color={palette.gold300} />
            <AppText variant="tiny" numberOfLines={1}>
              {item.lockReason}
            </AppText>
          </View>
        ) : null}
        {state === 'buy' ? (
          <View style={[styles.footer, styles.footerBuy]}>
            <Icon name="heart" size={moderateScale(12)} color={colors.hearts} />
            <AppText variant="label">{formatNumber(item.heartsPrice ?? 0)}</AppText>
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
  },
  panel: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  panelSelected: {
    borderColor: colors.primary,
  },
  newRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: palette.gold400,
    paddingHorizontal: spacing.sm,
    borderBottomRightRadius: radius.xs,
    zIndex: 1,
  },
  visual: {
    height: moderateScale(108),
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xxs,
  },
  footer: {
    marginTop: spacing.xs,
    width: '100%',
    minHeight: moderateScale(28),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  footerSelected: {
    backgroundColor: colors.primary,
  },
  footerUse: {
    backgroundColor: colors.primaryDeep,
  },
  footerLocked: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  footerBuy: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
