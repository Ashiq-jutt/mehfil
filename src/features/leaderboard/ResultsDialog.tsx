import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText, DialogCard } from '../../components';
import { moderateScale, spacing } from '../../theme';
import { RankRow } from './RankRow';
import type { LeaderboardBoard, LeaderboardPeriodDto } from '../../api/types';

type Props = { visible: boolean; onClose: () => void; board: LeaderboardBoard; period: LeaderboardPeriodDto | null };

/** Full frozen ranking of the previous period ("Results ≫" on the podium). */
export function ResultsDialog({ visible, onClose, board, period }: Props) {
  return (
    <DialogCard visible={visible} title={`${period?.label ?? 'Previous'} results`} onClose={onClose}>
      <View style={styles.list}>
        {period && period.entries.length === 0 ? (
          <AppText variant="body" color="textMuted" align="center">
            No gifts were sent {period.label.toLowerCase()}.
          </AppText>
        ) : null}
        <FlatList
          data={period?.entries ?? []}
          keyExtractor={e => e.id}
          renderItem={({ item }) => <RankRow entry={item} board={board} />}
          ItemSeparatorComponent={Gap}
        />
      </View>
    </DialogCard>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  list: {
    maxHeight: moderateScale(420),
  },
  gap: {
    height: spacing.xs,
  },
});
