import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, Icon } from '../../components';
import { colors, gradients, moderateScale, palette, radius, spacing } from '../../theme';

type Props = { level: number | null; onDone: () => void };

const RAY_COUNT = 8;

/** Celebration burst shown to everyone in the room when a gift pushes the club to the next level. */
export function LevelUpOverlay({ level, onDone }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (level === null) {
      return;
    }
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 480, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(progress, { toValue: 2, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => finished && onDone());
    return () => animation.stop();
  }, [level, progress, onDone]);

  if (level === null) {
    return null;
  }

  const scale = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [0.4, 1, 1.25] });
  const opacity = progress.interpolate({ inputRange: [0, 0.6, 1, 1.6, 2], outputRange: [0, 1, 1, 1, 0] });
  const spin = progress.interpolate({ inputRange: [0, 2], outputRange: ['0deg', '90deg'] });

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View style={[styles.rays, { opacity, transform: [{ rotate: spin }, { scale }] }]}>
        {Array.from({ length: RAY_COUNT }, (_, i) => (
          <View key={i} style={[styles.ray, { transform: [{ rotate: `${(180 / RAY_COUNT) * i}deg` }] }]} />
        ))}
      </Animated.View>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
          <Icon name="trophy" size={moderateScale(28)} color={colors.textOnGold} />
          <AppText variant="title" color="textOnGold" shadow>
            LEVEL {level}
          </AppText>
        </LinearGradient>
        <View style={styles.caption}>
          <AppText variant="label" shadow align="center">
            Club levelled up!
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
    top: '28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rays: {
    position: 'absolute',
    width: moderateScale(240),
    height: moderateScale(240),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: moderateScale(240),
    height: moderateScale(5),
    borderRadius: 3,
    backgroundColor: palette.gold300,
    opacity: 0.35,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: palette.white,
  },
  caption: {
    marginTop: spacing.xs,
  },
});
