import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { colors, gradients, moderateScale } from '../../theme';
import { Icon } from '../icons/Icon';

type Props = {
  uri?: string | null;
  size?: number;
  /** Gold ring (profile) or none (list rows). */
  ring?: 'gold' | 'none';
  style?: StyleProp<ViewStyle>;
};

/** Circular avatar with the gold ring from the profile screen and a silhouette placeholder. */
export function AvatarRing({ uri, size = moderateScale(64), ring = 'gold', style }: Props) {
  const ringWidth = ring === 'gold' ? Math.max(2, size * 0.045) : 0;
  const inner = size - ringWidth * 2;

  const image = uri ? (
    <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
  ) : (
    <View style={[styles.placeholder, { width: inner, height: inner, borderRadius: inner / 2 }]}>
      <Icon name="user" size={inner * 0.62} color="rgba(255,255,255,0.35)" />
    </View>
  );

  if (ring === 'none') {
    return <View style={[{ width: size, height: size, borderRadius: size / 2 }, style]}>{image}</View>;
  }

  return (
    <LinearGradient
      colors={gradients.gold}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2, padding: ringWidth }, style]}>
      {image}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    backgroundColor: colors.tileRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
