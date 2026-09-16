import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, CloseButton, ErrorState, IconButton, LoadingState, Panel } from '../../components';
import { RoyalBadge } from '../../components/badges/RoyalBadge';
import { useRoyalty } from '../../hooks/useRoyalty';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { formatNumber } from '../../utils/format';
import type { PrimeLevel, RoyalLevel, RoyaltyLevelDto } from '../../api/types';

type Props = { visible: boolean; onClose: () => void };

/** Bottom sheet listing Royal (R6→R1) and Prime (P3→P1) tiers with progress and benefits. */
export function RoyaltySheet({ visible, onClose }: Props) {
  const { data, isLoading, error, refetch } = useRoyalty(visible);
  const [tip, setTip] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View style={styles.titleSpacer} />
            <AppText variant="display" color="textGold" shadow uppercase>
              Royalty
            </AppText>
            <IconButton icon="info" size={moderateScale(30)} onPress={() => setTip(t => !t)} style={styles.titleSpacer} />
          </View>
          {tip ? (
            <View style={styles.tip}>
              <AppText variant="caption">Royal status is achieved by earning 👑 Royal points from hearts purchases.</AppText>
            </View>
          ) : null}
          <AppText variant="bodyStrong" align="center" style={styles.subtitle}>
            Unlock Royalty to gain exclusive benefits!
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {isLoading && !data ? <LoadingState /> : null}
            {error && !data ? <ErrorState title="Could not load royalty" actionLabel="Retry" onAction={() => refetch()} /> : null}
            {data ? (
              <>
                <Panel variant="dark" style={styles.panel}>
                  <AppText variant="heading" color="textSecondary" align="center" uppercase style={styles.panelTitle}>
                    Royal levels
                  </AppText>
                  <View style={styles.grid}>
                    {data.royalLevels.map(level => (
                      <LevelCell key={level.code} level={level} />
                    ))}
                  </View>
                </Panel>

                <Panel variant="dark" style={styles.panel}>
                  <AppText variant="heading" color="textSecondary" align="center" style={styles.panelTitle}>
                    Prime Levels
                  </AppText>
                  <View style={styles.grid}>
                    {data.primeLevels.map(level => (
                      <LevelCell key={level.code} level={level} />
                    ))}
                  </View>
                </Panel>

                <View style={styles.progress}>
                  <AppText variant="label" color="textGold" align="center">
                    {formatNumber(data.points)} Royal points
                  </AppText>
                  {data.nextLevelCode ? (
                    <AppText variant="caption" color="textMuted" align="center">
                      {formatNumber(data.pointsToNextLevel ?? 0)} more to reach {data.nextLevelCode}
                    </AppText>
                  ) : (
                    <AppText variant="caption" color="textMuted" align="center">
                      You have reached the highest tier
                    </AppText>
                  )}
                </View>

                <View style={styles.benefits}>
                  {data.benefits.map(b => (
                    <AppText key={b} variant="caption" color="textSecondary" style={styles.benefit}>
                      ★ {b}
                    </AppText>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
          <CloseButton onPress={onClose} style={styles.close} />
        </View>
      </View>
    </Modal>
  );
}

function LevelCell({ level }: { level: RoyaltyLevelDto }) {
  return (
    <View style={styles.cell}>
      <RoyalBadge level={level.code as RoyalLevel | PrimeLevel} size={moderateScale(58)} locked={!level.achieved} />
      <AppText variant="caption" color={level.achieved ? 'textGold' : 'textMuted'}>
        {level.achieved ? 'Achieved' : level.achievedAt ?? `${formatNumber(level.pointsRequired)} pts`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.tile,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSpacer: {
    width: moderateScale(30),
  },
  tip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  subtitle: {
    marginVertical: spacing.sm,
  },
  content: {
    paddingBottom: spacing.lg,
  },
  panel: {
    marginBottom: spacing.md,
  },
  panelTitle: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: spacing.md,
  },
  cell: {
    width: '30%',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  progress: {
    marginBottom: spacing.md,
    gap: 2,
  },
  benefits: {
    gap: spacing.xs,
  },
  benefit: {
    lineHeight: 18,
  },
  close: {
    position: 'absolute',
    top: -moderateScale(12),
    right: spacing.lg,
  },
});
