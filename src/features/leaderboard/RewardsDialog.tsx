import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, DialogCard, LoadingState, PillTabs } from '../../components';
import { useLeaderboardRewards } from '../../hooks/useLeaderboard';
import { colors, moderateScale, palette, radius, spacing } from '../../theme';
import { StoreItemThumb } from '../store/StoreItemThumb';
import { kindLabel } from '../store/storeCopy';
import { BOARD_TABS } from './leaderboardCopy';
import type { LeaderboardBoard } from '../../api/types';

type Props = { visible: boolean; onClose: () => void; initialBoard: LeaderboardBoard };

/** "Rewards" modal (INFO button): per board, the store items won at Rank #1–#3. */
export function RewardsDialog({ visible, onClose, initialBoard }: Props) {
  const [board, setBoard] = useState<LeaderboardBoard>(initialBoard);
  useEffect(() => {
    if (visible) {
      setBoard(initialBoard);
    }
  }, [visible, initialBoard]);

  const rewards = useLeaderboardRewards(visible);
  const ranks = rewards.data?.boards.find(b => b.board === board)?.ranks ?? [];

  return (
    <DialogCard visible={visible} title="Rewards" onClose={onClose}>
      <PillTabs items={BOARD_TABS} activeKey={board} onChange={key => setBoard(key as LeaderboardBoard)} style={styles.tabs} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rewards.isLoading ? <LoadingState /> : null}
        {rewards.error ? (
          <AppText variant="body" color="textMuted" align="center">
            Could not load rewards.
          </AppText>
        ) : null}
        {ranks.map(rank => (
          <View key={rank.rank} style={styles.block}>
            <View style={styles.ribbonRow}>
              <View style={styles.line} />
              <View style={styles.rankPill}>
                <AppText variant="tiny" color="textOnGold">
                  Rank #{rank.rank}
                </AppText>
              </View>
              <View style={styles.line} />
            </View>
            <View style={styles.items}>
              {rank.items.length === 0 ? (
                <AppText variant="tiny" color="textMuted">
                  No reward for this rank
                </AppText>
              ) : (
                rank.items.map(item => (
                  <View key={item.code} style={styles.item}>
                    <StoreItemThumb item={item} size={moderateScale(64)} />
                    <AppText variant="tiny" align="center" numberOfLines={1}>
                      {kindLabel(item.kind)}
                    </AppText>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  tabs: {
    marginBottom: spacing.md,
  },
  scroll: {
    maxHeight: moderateScale(380),
  },
  content: {
    backgroundColor: colors.modalDeep,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.lg,
  },
  block: {
    gap: spacing.md,
  },
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: palette.gold500,
    opacity: 0.6,
  },
  rankPill: {
    backgroundColor: palette.gold400,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: palette.gold200,
  },
  items: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    width: moderateScale(80),
  },
});
