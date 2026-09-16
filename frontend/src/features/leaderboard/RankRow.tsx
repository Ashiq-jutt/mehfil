import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, Icon } from '../../components';
import { RankBadge } from '../../components/badges/RankBadge';
import { RoyalBadge } from '../../components/badges/RoyalBadge';
import { colors, moderateScale, palette, radius, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { formatCompact } from '../../utils/format';
import { ClubCover } from '../clubs/ClubCover';
import type { LeaderboardBoard, LeaderboardEntryDto } from '../../api/types';

type Props = {
  entry: LeaderboardEntryDto;
  board: LeaderboardBoard;
  /** "me" is the sticky bottom row: never gold, slightly darker. */
  variant?: 'list' | 'me';
};

/** One ranking row: medal / crest, image, name + flag, hearts. Rank #1 is the gold row from the design. */
export function RankRow({ entry, board, variant = 'list' }: Props) {
  const first = variant === 'list' && entry.rank === 1;
  const isClub = board === 'TopClubs';
  const textColor = first ? 'textOnGold' : 'textPrimary';

  return (
    <View style={[styles.row, first ? styles.rowFirst : null, variant === 'me' ? styles.rowMe : null]} accessibilityLabel={`Rank ${entry.rank}: ${entry.name}`}>
      <View style={styles.rankSlot}>
        <RankBadge rank={entry.rank} size={moderateScale(34)} />
      </View>
      <View style={styles.image}>
        {isClub ? (
          <ClubCover uri={entry.imageUrl} name={entry.name} radius={radius.sm} />
        ) : (
          <AvatarRing uri={resolveAssetUrl(entry.imageUrl)} size={moderateScale(40)} ring="none" />
        )}
      </View>
      <View style={styles.text}>
        <AppText variant="label" color={textColor} numberOfLines={1}>
          {entry.name}
        </AppText>
        <View style={styles.meta}>
          {entry.flagEmoji ? <AppText variant="tiny">{entry.flagEmoji}</AppText> : null}
          {isClub ? (
            <AppText variant="tiny" color={first ? 'textOnGold' : 'textMuted'}>
              Lv {entry.level}
            </AppText>
          ) : entry.royalLevel !== 'None' ? (
            <RoyalBadge level={entry.royalLevel} size={moderateScale(18)} />
          ) : null}
        </View>
      </View>
      <View style={styles.score}>
        <Icon name="heart" size={moderateScale(14)} color={colors.hearts} />
        <AppText variant="label" color={textColor}>
          {formatCompact(entry.score)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: moderateScale(56),
  },
  rowFirst: {
    backgroundColor: palette.gold500,
    borderColor: palette.gold300,
  },
  rowMe: {
    backgroundColor: colors.modalDeep,
    borderColor: colors.borderStrong,
  },
  rankSlot: {
    width: moderateScale(36),
    alignItems: 'center',
  },
  image: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
