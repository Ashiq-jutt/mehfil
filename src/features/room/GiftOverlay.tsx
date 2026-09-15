import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { giftEmoji } from '../economy/giftIcons';
import type { GiftEventDto } from '../../api/types';

type Props = { event: GiftEventDto | null; onDone: () => void };

/** Floating gift banner that rises and fades when someone sends a gift. */
export function GiftOverlay({ event, onDone }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) {
      return;
    }
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(progress, { toValue: 2, duration: 500, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => finished && onDone());
    return () => animation.stop();
  }, [event, progress, onDone]);

  if (!event) {
    return null;
  }

  const translateY = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [40, 0, -60] });
  const opacity = progress.interpolate({ inputRange: [0, 0.5, 1, 1.5, 2], outputRange: [0, 1, 1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [0.8, 1, 1.15] });

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View style={[styles.banner, { opacity, transform: [{ translateY }, { scale }] }]}>
        <AppText variant="display">{giftEmoji(event.gift.code)}</AppText>
        <View style={styles.text}>
          <AppText variant="label" numberOfLines={1}>
            {event.sender.displayName}
          </AppText>
          <AppText variant="tiny" color="textSecondary" numberOfLines={1}>
            sent {event.gift.name} ×{event.quantity}
            {event.receiver ? ` to ${event.receiver.displayName}` : ''}
          </AppText>
        </View>
        {event.leveledUp ? (
          <View style={styles.levelUp}>
            <AppText variant="tiny" color="textOnGold">
              LEVEL {event.clubLevel.level}!
            </AppText>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: moderateScale(70),
    top: '38%',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(60, 16, 90, 0.9)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.borderGold,
  },
  text: {
    flex: 1,
  },
  levelUp: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
  },
});
