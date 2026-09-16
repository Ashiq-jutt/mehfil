import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Icon } from '../../components';
import { colors, moderateScale } from '../../theme';
import { formatCompact } from '../../utils/format';
import { ClubCover } from './ClubCover';
import { styles } from './ClubCard.styles';
import type { ClubCardDto } from '../../api/types';

type Props = {
  club: ClubCardDto;
  onPress: (club: ClubCardDto) => void;
  onToggleFollow: (club: ClubCardDto) => void;
};

/** Two-column grid card: cover, live/member badge, level, "MY CLUB" ribbon, name, category, flag, follow heart. */
export const ClubCard = memo(function ClubCardItem({ club, onPress, onToggleFollow }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${club.name}, level ${club.level}`}
      onPress={() => onPress(club)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={styles.coverWrap}>
        <ClubCover uri={club.coverUrl} name={club.name} />

        <View style={[styles.countPill, club.isLive ? styles.countPillLive : null]}>
          {club.isLive ? <View style={styles.liveDot} /> : <Icon name="user" size={moderateScale(11)} color={colors.white} />}
          <AppText variant="tiny">{formatCompact(club.isLive ? club.onlineCount : club.memberCount)}</AppText>
        </View>

        {club.isMine ? (
          <View style={styles.mineRibbon}>
            <AppText variant="tiny" color="textOnGold">
              MY CLUB
            </AppText>
          </View>
        ) : null}

        <View style={styles.levelBadge}>
          <AppText variant="tiny" color="textOnGold">
            {club.level}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText variant="label" numberOfLines={1}>
          {club.name}
        </AppText>
        <View style={styles.metaRow}>
          <View style={styles.categoryChip}>
            <AppText variant="tiny">{club.categoryName}</AppText>
          </View>
          {club.flagEmoji ? <AppText variant="caption">{club.flagEmoji}</AppText> : null}
          <View style={styles.metaSpacer} />
          {!club.isMine ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={club.isFollowing ? 'Unfollow' : 'Follow'}
              hitSlop={8}
              onPress={() => onToggleFollow(club)}>
              <Icon name={club.isFollowing ? 'heart' : 'heartOutline'} size={moderateScale(18)} color={club.isFollowing ? colors.hearts : colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
