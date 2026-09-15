import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, AvatarRing } from '../../components';
import { RankBadge } from '../../components/badges/RankBadge';
import { colors, moderateScale, palette, radius, shadows, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { formatCompact } from '../../utils/format';
import { ClubCover } from '../clubs/ClubCover';
import type { LeaderboardBoard, LeaderboardEntryDto } from '../../api/types';

type Props = {
  label: string;
  entries: LeaderboardEntryDto[];
  board: LeaderboardBoard;
  onResults: () => void;
};

/** "Last Week" / "Yesterday" podium (2 · 1 · 3) with the Results button. Empty slots show the design's empty rings. */
export function Podium({ label, entries, board, onResults }: Props) {
  const isClub = board === 'TopClubs';
  const slots = [
    { entry: entries[1], rank: 2, size: moderateScale(52), lift: moderateScale(14) },
    { entry: entries[0], rank: 1, size: moderateScale(66), lift: moderateScale(28) },
    { entry: entries[2], rank: 3, size: moderateScale(48), lift: 0 },
  ];

  return (
    <LinearGradient colors={[palette.plum300, palette.plum700]} style={styles.card}>
      <View style={styles.titleBar}>
        <AppText variant="label" shadow>
          {label}
        </AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={onResults} style={styles.results} hitSlop={6}>
        <AppText variant="tiny" color="textOnGold">
          Results ≫
        </AppText>
      </Pressable>

      <View style={styles.stage}>
        {slots.map(({ entry, rank, size, lift }) => (
          <View key={rank} style={[styles.slot, { marginBottom: lift }]}>
            <View style={styles.crest}>
              <RankBadge rank={rank} size={moderateScale(22)} />
            </View>
            <View style={[styles.avatar, { width: size, height: size, borderRadius: isClub ? radius.sm : size / 2 }]}>
              {entry ? (
                isClub ? (
                  <ClubCover uri={entry.imageUrl} name={entry.name} radius={radius.sm} />
                ) : (
                  <AvatarRing uri={resolveAssetUrl(entry.imageUrl)} size={size} ring="none" />
                )
              ) : (
                <View style={[styles.emptyRing, { width: size, height: size, borderRadius: isClub ? radius.sm : size / 2 }]} />
              )}
            </View>
            <View style={[styles.step, rank === 1 ? styles.stepFirst : null]}>
              <AppText variant="tiny" numberOfLines={1} align="center">
                {entry ? entry.name : '—'}
              </AppText>
              <AppText variant="tiny" color="textGold" numberOfLines={1} align="center">
                {entry ? `${entry.flagEmoji ? `${entry.flagEmoji} ` : ''}♥ ${formatCompact(entry.score)}` : 'No results'}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderMagenta,
    paddingTop: moderateScale(34),
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  titleBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  results: {
    position: 'absolute',
    top: moderateScale(38),
    right: spacing.sm,
    backgroundColor: palette.gold400,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    zIndex: 1,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  slot: {
    width: '30%',
    alignItems: 'center',
  },
  crest: {
    marginBottom: -moderateScale(10),
    zIndex: 1,
  },
  avatar: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.gold400,
  },
  emptyRing: {
    borderWidth: 3,
    borderColor: palette.gold400,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  step: {
    marginTop: spacing.xs,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  stepFirst: {
    backgroundColor: 'rgba(124, 58, 237, 0.55)',
  },
});
