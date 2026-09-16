import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, moderateScale, radius, screen, spacing } from '../../theme';
import { entryStyle } from '../store/cosmetics';

export type RoomEntry = { id: string; displayName: string; entryStyleCode: string };

type Props = { entry: RoomEntry | null; onDone: () => void };

/** Club Store entry styles: the member's vehicle flies across the room when they arrive. */
export function EntryOverlay({ entry, onDone }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!entry) {
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => finished && onDone());
    return () => animation.stop();
  }, [entry, progress, onDone]);

  if (!entry) {
    return null;
  }

  const style = entryStyle(entry.entryStyleCode);
  if (!style) {
    return null;
  }

  const travel = screen.width + moderateScale(200);
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-moderateScale(180), travel] });
  const translateY = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -moderateScale(14), 0] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View style={[styles.vehicle, { opacity, transform: [{ translateX }, { translateY }] }]}>
        <AppText style={styles.emoji}>{style.emoji}</AppText>
        <View style={styles.label}>
          <AppText variant="tiny" numberOfLines={1}>
            {entry.displayName}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    height: moderateScale(70),
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  emoji: {
    fontSize: moderateScale(40),
    lineHeight: moderateScale(48),
  },
  label: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderGold,
    maxWidth: moderateScale(140),
  },
});
