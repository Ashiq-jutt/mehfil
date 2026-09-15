import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton, SkeletonList } from '../../components';
import { moderateScale, radius, spacing } from '../../theme';

/** Placeholder rows matching the notification inbox. */
export function NotificationsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading notifications" style={styles.root}>
      <SkeletonList count={rows} gap={spacing.xs}>
        {() => (
          <View style={styles.row}>
            <Skeleton width={moderateScale(38)} height={moderateScale(38)} shape="circle" />
            <View style={styles.text}>
              <Skeleton width="75%" height={moderateScale(12)} />
              <Skeleton width="55%" height={moderateScale(10)} />
              <Skeleton width="25%" height={moderateScale(8)} />
            </View>
          </View>
        )}
      </SkeletonList>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
