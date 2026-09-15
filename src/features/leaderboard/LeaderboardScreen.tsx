import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, CloseButton, EmptyState, ErrorState, Icon, PillTabs, Screen } from '../../components';
import { useLeaderboard, useLeaderboardRewards } from '../../hooks/useLeaderboard';
import { useNow } from '../../hooks/useNow';
import type { MainStackScreenProps } from '../../navigation/types';
import { colors, moderateScale, palette, radius, spacing } from '../../theme';
import { formatCompact, formatCountdown } from '../../utils/format';
import { StoreItemThumb } from '../store/StoreItemThumb';
import { BOARD_TABS, PERIOD_TABS, subjectHeading } from './leaderboardCopy';
import { LeaderboardSkeleton } from './LeaderboardSkeleton';
import { Podium } from './Podium';
import { RankRow } from './RankRow';
import { ResultsDialog } from './ResultsDialog';
import { RewardsDialog } from './RewardsDialog';
import type { LeaderboardBoard, LeaderboardPeriod } from '../../api/types';

/** Leaderboard: Top Clubs (weekly) · Top Gifters / Top Receivers (daily or weekly), podium, live table and my rank. */
export function LeaderboardScreen({ navigation }: MainStackScreenProps<'Leaderboard'>) {
  const [board, setBoard] = useState<LeaderboardBoard>('TopClubs');
  const [period, setPeriod] = useState<LeaderboardPeriod>('Weekly');
  const effectivePeriod: LeaderboardPeriod = board === 'TopClubs' ? 'Weekly' : period;
  const query = useLeaderboard(board, effectivePeriod);
  const rewards = useLeaderboardRewards();
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const now = useNow();

  const data = query.data;
  const topRewards = rewards.data?.boards.find(b => b.board === board)?.ranks.find(r => r.rank === 1)?.items ?? [];

  const header = data ? (
    <View style={styles.header}>
      <Podium label={data.previous.label} entries={data.previous.entries} board={board} onResults={() => setResultsOpen(true)} />

      <View style={styles.currentPanel}>
        <View style={styles.currentTitleRow}>
          <AppText variant="heading" shadow uppercase>
            {data.current.label}
          </AppText>
          <View style={styles.countdown}>
            <AppText variant="tiny">
              ⏱ {effectivePeriod === 'Daily' ? 'Ends in: ' : ''}
              {formatCountdown(new Date(data.current.end).getTime() - now)}
            </AppText>
          </View>
        </View>

        {effectivePeriod === 'Daily' ? (
          <View style={styles.dailyRow}>
            <View style={styles.dailyReward}>
              <Icon name="trophy" size={moderateScale(16)} color={colors.textOnGold} />
              <AppText variant="tiny" color="textOnGold">
                Daily Reward
              </AppText>
            </View>
            <View style={styles.totalPill}>
              <AppText variant="tiny" color="textMuted">
                Total
              </AppText>
              <AppText variant="label">♥ {formatCompact(data.current.totalHearts)}</AppText>
            </View>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" accessibilityLabel="Rewards" onPress={() => setRewardsOpen(true)} style={styles.winBanner}>
          <Icon name="trophy" size={moderateScale(28)} color={colors.accent} />
          <AppText variant="label" shadow style={styles.winText}>
            WIN REWARD!!!
          </AppText>
          <View style={styles.rewardThumbs}>
            {topRewards.slice(0, 3).map(item => (
              <StoreItemThumb key={item.code} item={item} size={moderateScale(34)} />
            ))}
          </View>
          <AppText variant="label" color="textGold">
            ≫
          </AppText>
        </Pressable>

        <View style={styles.tableHeader}>
          <AppText variant="tiny" color="textMuted" style={styles.colRank}>
            RANK
          </AppText>
          <AppText variant="tiny" color="textMuted" style={styles.colName}>
            {subjectHeading(board)}
          </AppText>
          <AppText variant="tiny" color="textMuted">
            HEARTS
          </AppText>
        </View>
      </View>
    </View>
  ) : null;

  return (
    <Screen variant="sky">
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Rewards info" onPress={() => setRewardsOpen(true)} style={styles.infoButton} hitSlop={6}>
          <AppText variant="label" shadow>
            INFO
          </AppText>
        </Pressable>
        <AppText variant="title" color="textGold" shadow uppercase>
          Leaderboard
        </AppText>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      <PillTabs items={BOARD_TABS} activeKey={board} onChange={key => setBoard(key as LeaderboardBoard)} style={styles.tabs} />
      {board !== 'TopClubs' ? (
        <PillTabs items={PERIOD_TABS} activeKey={period} onChange={key => setPeriod(key as LeaderboardPeriod)} style={styles.periodTabs} />
      ) : null}

      {query.isLoading && !data ? <LeaderboardSkeleton /> : null}
      {query.error && !data ? <ErrorState title="Could not load the leaderboard" actionLabel="Retry" onAction={() => query.refetch()} /> : null}

      {data ? (
        <FlatList
          data={data.current.entries}
          keyExtractor={e => e.id}
          renderItem={({ item }) => <RankRow entry={item} board={board} />}
          ListHeaderComponent={header ?? undefined}
          ListEmptyComponent={
            <EmptyState
              icon="gift"
              title={`No gifts ${data.current.label.toLowerCase()} yet`}
              message={board === 'TopClubs' ? 'Gifts sent inside a club count toward its rank.' : 'Send or receive gifts in a club room to appear here.'}
            />
          }
          ItemSeparatorComponent={Gap}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => {
                query.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        />
      ) : null}

      {data?.me ? (
        <View style={styles.meBar}>
          <RankRow entry={data.me} board={board} variant="me" />
        </View>
      ) : null}

      <RewardsDialog visible={rewardsOpen} onClose={() => setRewardsOpen(false)} initialBoard={board} />
      <ResultsDialog visible={resultsOpen} onClose={() => setResultsOpen(false)} board={board} period={data?.previous ?? null} />
    </Screen>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  infoButton: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tabs: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  periodTabs: {
    marginHorizontal: spacing.xxxl,
    marginTop: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: moderateScale(90),
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  currentPanel: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdown: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.gold400,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  totalPill: {
    alignItems: 'center',
    backgroundColor: colors.tileRaised,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  winBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.panelRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderMagenta,
  },
  winText: {
    flex: 1,
  },
  rewardThumbs: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  colRank: {
    width: moderateScale(44),
  },
  colName: {
    flex: 1,
    textAlign: 'center',
  },
  gap: {
    height: spacing.xs,
  },
  meBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
});
