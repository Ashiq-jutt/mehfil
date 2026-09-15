import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../../components';
import { moderateScale, radius, spacing } from '../../theme';

/** Two-column placeholder matching the club card layout while the first page loads. */
export function ClubGridSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading clubs" style={styles.grid}>
      {Array.from({ length: rows * 2 }, (_, i) => (
        <View key={i} style={styles.cell}>
          <Skeleton height={moderateScale(104)} style={styles.cover} />
          <Skeleton width="72%" height={moderateScale(12)} />
          <Skeleton width="45%" height={moderateScale(10)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  cover: {
    borderRadius: radius.md,
  },
});
