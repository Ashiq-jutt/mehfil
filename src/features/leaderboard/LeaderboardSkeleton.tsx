import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton, SkeletonList } from '../../components';
import { moderateScale, radius, spacing } from '../../theme';

/** Podium block plus ranking rows, matching the leaderboard layout. */
export function LeaderboardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading leaderboard" style={styles.root}>
      <Skeleton height={moderateScale(150)} style={styles.podium} />
      <Skeleton width="55%" height={moderateScale(18)} />
      <SkeletonList count={rows} gap={spacing.xs}>
        {() => (
          <View style={styles.row}>
            <Skeleton width={moderateScale(30)} height={moderateScale(30)} shape="circle" />
            <Skeleton width={moderateScale(40)} height={moderateScale(40)} />
            <View style={styles.text}>
              <Skeleton width="60%" height={moderateScale(12)} />
              <Skeleton width="30%" height={moderateScale(9)} />
            </View>
            <Skeleton width={moderateScale(52)} height={moderateScale(12)} />
          </View>
        )}
      </SkeletonList>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.md,
    gap: spacing.md,
  },
  podium: {
    borderRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: moderateScale(56),
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
