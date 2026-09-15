import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radius, spacing } from '../../theme';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  /** Defaults to a rounded rectangle; pass "circle" for avatars. */
  shape?: 'rect' | 'circle' | 'pill';
  style?: StyleProp<ViewStyle>;
};

/** A single pulsing grey block standing in for content that is still loading. */
export function Skeleton({ width = '100%', height = 16, shape = 'rect', style }: Props) {
  const pulse = usePulse();
  const borderRadius = shape === 'circle' ? height / 2 : shape === 'pill' ? radius.pill : radius.sm;
  return <Animated.View style={[styles.block, { width, height, borderRadius, opacity: pulse }, style]} />;
}

/** Shared pulse so every skeleton on a screen breathes together. */
function usePulse(): Animated.Value {
  const value = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 0.9, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [value]);
  return value;
}

/** Repeats a skeleton row n times with even spacing. */
export function SkeletonList({ count, gap = spacing.md, children }: { count: number; gap?: number; children: (index: number) => React.ReactNode }) {
  return (
    <View style={{ gap }} accessibilityLabel="Loading">
      {Array.from({ length: count }, (_, i) => (
        <View key={i}>{children(i)}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
});
