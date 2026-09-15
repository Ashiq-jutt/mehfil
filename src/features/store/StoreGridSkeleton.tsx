import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../../components';
import { moderateScale, radius, spacing } from '../../theme';

/** Two-column placeholder matching the store tiles. */
export function StoreGridSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading store" style={styles.grid}>
      {Array.from({ length: rows * 2 }, (_, i) => (
        <View key={i} style={styles.cell}>
          <Skeleton height={moderateScale(150)} style={styles.tile} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
  },
  tile: {
    borderRadius: radius.md,
  },
});
