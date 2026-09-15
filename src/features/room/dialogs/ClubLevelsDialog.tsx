import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, Button, DialogCard, Icon } from '../../../components';
import { toast } from '../../../store/toastStore';
import { colors, gradients, moderateScale, palette, radius, spacing } from '../../../theme';
import { formatNumber } from '../../../utils/format';
import type { ClubLevelDto } from '../../../api/types';

type Props = { visible: boolean; onClose: () => void; level: ClubLevelDto };

/** "CLUBS LEVELS": jar fill, daily reset countdown and jars-to-next-level progress. */
export function ClubLevelsDialog({ visible, onClose, level }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [visible]);

  const jarPct = Math.min(1, level.jarTarget ? level.jarHearts / level.jarTarget : 0);
  const levelPct = Math.min(1, level.jarsForNextLevel ? level.jarsCollected / level.jarsForNextLevel : 0);

  return (
    <DialogCard visible={visible} onClose={onClose}>
      <LinearGradient colors={gradients.ribbon} style={styles.title}>
        <AppText variant="title" color="textGold" shadow uppercase>
          Clubs Levels
        </AppText>
      </LinearGradient>

      <View style={styles.resetRow}>
        <AppText variant="tiny" color="textMuted">
          Resets in
        </AppText>
        <View style={styles.resetPill}>
          <AppText variant="label">⏳ {formatCountdown(new Date(level.jarResetsAt).getTime() - now)}</AppText>
        </View>
      </View>
      <AppText variant="caption" color="textSecondary" align="center">
        Gifting fills up the jar
      </AppText>

      <View style={styles.jarWrap}>
        <View style={styles.jar}>
          <View style={[styles.jarFill, { height: `${Math.max(6, jarPct * 100)}%` }]} />
          <View style={styles.jarHeart}>
            <Icon name="heart" size={moderateScale(44)} color={colors.hearts} />
          </View>
        </View>
        <View style={styles.jarCount}>
          <AppText variant="label" shadow>
            ♥ {formatNumber(level.jarHearts)} / {formatNumber(level.jarTarget)}
          </AppText>
        </View>
      </View>

      <View style={styles.levelPanel}>
        <View style={styles.levelBanner}>
          <AppText variant="label" shadow>
            Collect jars to level up
          </AppText>
        </View>
        <View style={styles.levelRow}>
          <LevelBadge level={level.level} />
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${levelPct * 100}%` }]} />
            <View style={styles.trackLabel}>
              <AppText variant="tiny">
                {level.jarsCollected}/{level.jarsForNextLevel}
              </AppText>
            </View>
          </View>
          <LevelBadge level={level.level + 1} gold />
        </View>
        <Button label="Rewards ≫" variant="ghost" onPress={() => toast.info('Level rewards arrive with the Club Store in phase 10.')} style={styles.rewards} />
      </View>
    </DialogCard>
  );
}

function LevelBadge({ level, gold = false }: { level: number; gold?: boolean }) {
  return (
    <View style={[styles.badge, gold ? styles.badgeGold : null]}>
      <AppText variant="heading" color={gold ? 'textOnGold' : 'textPrimary'}>
        {level}
      </AppText>
    </View>
  );
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours} hrs ${mins} mins`;
}

const styles = StyleSheet.create({
  title: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  resetRow: {
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.xs,
  },
  resetPill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  jarWrap: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  jar: {
    width: moderateScale(120),
    height: moderateScale(130),
    borderRadius: radius.xl,
    borderBottomLeftRadius: moderateScale(50),
    borderBottomRightRadius: moderateScale(50),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 3,
    borderColor: palette.gold400,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  jarFill: {
    backgroundColor: colors.hearts,
    opacity: 0.85,
  },
  jarHeart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarCount: {
    marginTop: -spacing.md,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.gold400,
  },
  levelPanel: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  levelBanner: {
    alignSelf: 'center',
    backgroundColor: colors.info,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  badgeGold: {
    backgroundColor: palette.gold400,
  },
  track: {
    flex: 1,
    height: moderateScale(18),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  trackLabel: {
    alignItems: 'center',
  },
  rewards: {
    alignSelf: 'flex-end',
    height: moderateScale(32),
  },
});
