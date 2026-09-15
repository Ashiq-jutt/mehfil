import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, AvatarRing, Icon } from '../../components';
import { colors, gradients, moderateScale, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import type { SeatDto } from '../../api/types';

type Props = {
  seats: SeatDto[];
  myId?: string;
  onPressSeat: (seat: SeatDto) => void;
};

/** Two rows of five seats. Seat 5 is the owner seat with a gold frame and an "Owner" tag. */
export function SeatGrid({ seats, myId, onPressSeat }: Props) {
  const rows = [seats.slice(0, 5), seats.slice(5, 10)];
  return (
    <View style={styles.grid}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(seat => (
            <Seat key={seat.index} seat={seat} isMe={!!seat.user && seat.user.id === myId} onPress={onPressSeat} />
          ))}
        </View>
      ))}
    </View>
  );
}

const SEAT = moderateScale(52);

const Seat = memo(function SeatItem({ seat, isMe, onPress }: { seat: SeatDto; isMe: boolean; onPress: (seat: SeatDto) => void }) {
  const user = seat.user;
  const speaking = !!user?.isSpeaking;
  const label = user ? user.displayName : seat.isLocked ? '' : String(seat.index);

  const circle = user ? (
    <AvatarRing uri={resolveAssetUrl(user.avatarUrl)} size={SEAT} ring="none" />
  ) : (
    <View style={[styles.empty, seat.isLocked ? styles.locked : null]}>
      <Icon name={seat.isLocked ? 'lock' : 'mic'} size={moderateScale(18)} color="rgba(255,255,255,0.7)" />
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={user ? `Seat ${seat.index}: ${user.displayName}` : seat.isLocked ? `Seat ${seat.index} locked` : `Seat ${seat.index} empty`}
      onPress={() => onPress(seat)}
      style={({ pressed }) => [styles.seat, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.circleWrap, speaking ? styles.speaking : null, isMe ? styles.mine : null]}>
        {seat.isOwnerSeat ? (
          <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ownerFrame}>
            {circle}
          </LinearGradient>
        ) : (
          circle
        )}
        {user && !user.micEnabled ? (
          <View style={styles.micOff}>
            <Icon name="micOff" size={moderateScale(10)} color={colors.white} strokeWidth={2.5} />
          </View>
        ) : null}
        {seat.isMuted && user ? (
          <View style={[styles.micOff, styles.adminMuted]}>
            <Icon name="micOff" size={moderateScale(10)} color={colors.white} strokeWidth={2.5} />
          </View>
        ) : null}
      </View>

      {seat.isOwnerSeat && user ? (
        <View style={styles.ownerTag}>
          <AppText variant="tiny">Owner</AppText>
        </View>
      ) : (
        <AppText variant="tiny" color={user ? 'textPrimary' : 'textMuted'} numberOfLines={1} style={styles.name}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  seat: {
    width: SEAT + 16,
    alignItems: 'center',
    gap: 3,
  },
  circleWrap: {
    width: SEAT + 6,
    height: SEAT + 6,
    borderRadius: (SEAT + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  speaking: {
    borderColor: colors.speaking,
  },
  mine: {
    borderColor: colors.accentSoft,
  },
  ownerFrame: {
    width: SEAT + 6,
    height: SEAT + 6,
    borderRadius: (SEAT + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    width: SEAT,
    height: SEAT,
    borderRadius: SEAT / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  micOff: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  adminMuted: {
    backgroundColor: colors.danger,
    left: -2,
    right: undefined,
  },
  name: {
    maxWidth: SEAT + 16,
  },
  ownerTag: {
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
