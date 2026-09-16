import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { StoreItemVisual } from './StoreItemVisual';
import { kindLabel } from './storeCopy';
import type { StoreItemKind, StoreKindDto } from '../../api/types';

export const KIND_ORDER: StoreItemKind[] = ['Frame', 'ChatBubble', 'EntryStyle', 'Background', 'Card', 'ClubDp'];

const SAMPLE_CODE: Record<StoreItemKind, string> = {
  Frame: 'frame_royal_4',
  ChatBubble: 'chatbubble_gold_scroll',
  EntryStyle: 'entrystyle_jet',
  Background: 'background_club_20',
  Card: 'card_club_12',
  ClubDp: 'clubdp_lantern',
};

type Props = { kinds: StoreKindDto[]; active: StoreItemKind; onChange: (kind: StoreItemKind) => void };

/** Icon strip under the store banner; a red count badge marks kinds with new (never used) items. */
export function KindTabs({ kinds, active, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {KIND_ORDER.map(kind => {
        const isActive = kind === active;
        const newCount = kinds.find(k => k.kind === kind)?.newCount ?? 0;
        return (
          <Pressable
            key={kind}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={kindLabel(kind)}
            onPress={() => onChange(kind)}
            style={({ pressed }) => [styles.tab, isActive ? styles.tabActive : null, { opacity: pressed ? 0.85 : 1 }]}>
            <View style={styles.icon}>
              <StoreItemVisual code={SAMPLE_CODE[kind]} kind={kind} size={moderateScale(30)} />
            </View>
            <AppText variant="tiny" color={isActive ? 'textPrimary' : 'textMuted'} numberOfLines={1}>
              {kindLabel(kind)}
            </AppText>
            {newCount > 0 ? (
              <View style={styles.badge}>
                <AppText variant="tiny">{newCount}</AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tab: {
    width: moderateScale(76),
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: colors.borderGold,
  },
  icon: {
    height: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: spacing.sm,
    minWidth: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
});
