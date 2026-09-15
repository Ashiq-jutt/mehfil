import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, CloseButton, Icon } from '../../components';
import { colors, moderateScale, palette, radius, spacing } from '../../theme';
import { formatNumber } from '../../utils/format';
import { entryStyle } from './cosmetics';
import { StoreItemVisual } from './StoreItemVisual';
import type { StoreItemDto } from '../../api/types';

type Props = {
  visible: boolean;
  items: StoreItemDto[];
  initialCode: string | null;
  avatarUri?: string;
  clubLevel: number;
  busy: boolean;
  onClose: () => void;
  onUse: (item: StoreItemDto) => void;
  onBuy: (item: StoreItemDto) => void;
};

/** Full-screen preview carousel: name, large item, unlock rule, and the Use / Buy action. */
export function StoreItemPreviewDialog({ visible, items, initialCode, avatarUri, clubLevel, busy, onClose, onUse, onBuy }: Props) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (visible) {
      const i = items.findIndex(it => it.code === initialCode);
      setIndex(i < 0 ? 0 : i);
    }
  }, [visible, initialCode, items]);

  const item = items[index];
  if (!item) {
    return null;
  }

  const arrival = item.kind === 'EntryStyle' ? entryStyle(item.code) : null;
  const previewSize = item.kind === 'Background' ? moderateScale(210) : moderateScale(160);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <CloseButton onPress={onClose} style={styles.close} />
        <AppText variant="title" shadow align="center">
          {item.name}
        </AppText>

        <View style={styles.stage}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous item" disabled={index === 0} onPress={() => setIndex(i => Math.max(0, i - 1))} style={styles.arrow} hitSlop={10}>
            <Icon name="chevronLeft" size={moderateScale(30)} color={index === 0 ? colors.textMuted : colors.textPrimary} />
          </Pressable>
          <View style={styles.visual}>
            <StoreItemVisual code={item.code} kind={item.kind} size={previewSize} avatarUri={avatarUri} />
            {item.kind === 'Background' && item.unlockRule === 'ClubLevel' && !item.isOwned ? (
              <View style={styles.sceneNote}>
                <Icon name="lock" size={moderateScale(12)} color={palette.gold300} />
                <AppText variant="tiny">
                  Unlocks at Club Level {item.unlockValue} · your club is level {clubLevel}
                </AppText>
              </View>
            ) : null}
            {arrival ? (
              <AppText variant="caption" color="textSecondary" align="center">
                You arrive by {arrival.label}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next item"
            disabled={index >= items.length - 1}
            onPress={() => setIndex(i => Math.min(items.length - 1, i + 1))}
            style={styles.arrow}
            hitSlop={10}>
            <Icon name="chevronRight" size={moderateScale(30)} color={index >= items.length - 1 ? colors.textMuted : colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.status}>
          {item.isEquipped ? (
            <View style={styles.check}>
              <Icon name="check" size={moderateScale(18)} color={colors.white} strokeWidth={3} />
            </View>
          ) : null}
          {!item.isOwned ? (
            <View style={styles.rule}>
              <Icon name="lock" size={moderateScale(14)} color={palette.gold300} />
              <AppText variant="label" align="center">
                {item.unlockRule === 'Leaderboard' ? 'Win via Leaderboard' : item.unlockRule === 'Purchase' ? 'Buy with hearts' : item.lockReason}
              </AppText>
            </View>
          ) : null}
          {!item.isOwned && item.unlockRule === 'Leaderboard' && item.unlockLabel ? (
            <View style={styles.rule}>
              <Icon name="trophy" size={moderateScale(14)} color={palette.gold300} />
              <AppText variant="tiny" color="textSecondary">
                {item.unlockLabel}
              </AppText>
            </View>
          ) : null}
          {item.isOwned && !item.isEquipped ? <Button label="Use" loading={busy} onPress={() => onUse(item)} style={styles.action} /> : null}
          {!item.isOwned && !item.isLocked ? (
            <Button label={`Buy for ♥ ${formatNumber(item.heartsPrice ?? 0)}`} loading={busy} onPress={() => onBuy(item)} style={styles.action} />
          ) : null}
        </View>

        <AppText variant="tiny" color="textMuted" align="center">
          {index + 1} / {items.length}
        </AppText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 3, 20, 0.94)',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  close: {
    position: 'absolute',
    top: moderateScale(48),
    right: spacing.md,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: moderateScale(44),
    alignItems: 'center',
  },
  visual: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  sceneNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  status: {
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(64),
  },
  check: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  action: {
    minWidth: moderateScale(160),
  },
});
