import React from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText, Icon, IconButton } from '../../components';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { formatCompact } from '../../utils/format';
import { ClubCover } from '../clubs/ClubCover';
import type { RoomClubDto } from '../../api/types';

type Props = {
  club: RoomClubDto;
  onlineCount: number;
  onPressInfo: () => void;
  onToggleFollow: () => void;
  onExit: () => void;
  isOwner: boolean;
};

/** Club DP · name / ID · follow · share · exit, with the online count underneath. */
export function RoomHeader({ club, onlineCount, onPressInfo, onToggleFollow, onExit, isOwner }: Props) {
  const share = () => Share.share({ message: `Join "${club.name}" on Mehfil — Club ID ${club.id}` }).catch(() => undefined);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Club info" onPress={onPressInfo} style={styles.identity}>
          <View style={styles.cover}>
            <ClubCover uri={club.coverUrl} name={club.name} radius={radius.sm} />
          </View>
          <View style={styles.names}>
            <AppText variant="heading" numberOfLines={1}>
              {club.name}
            </AppText>
            <AppText variant="tiny" color="textSecondary">
              ID : {club.id}
            </AppText>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {!isOwner ? (
            <IconButton
              icon={club.isFollowing ? 'heart' : 'heartOutline'}
              color={club.isFollowing ? colors.hearts : colors.textPrimary}
              accessibilityLabel={club.isFollowing ? 'Unfollow' : 'Follow'}
              size={moderateScale(36)}
              onPress={onToggleFollow}
            />
          ) : null}
          <IconButton icon="share" accessibilityLabel="Share" size={moderateScale(36)} onPress={share} />
          <IconButton icon="logout" accessibilityLabel="Exit club" size={moderateScale(36)} background="rgba(213,27,84,0.55)" onPress={onExit} />
        </View>
      </View>

      <View style={styles.countRow}>
        <View style={styles.countPill}>
          <Icon name="user" size={moderateScale(12)} color={colors.white} />
          <AppText variant="tiny">{formatCompact(onlineCount)}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cover: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.borderGold,
  },
  names: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  countRow: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
});
