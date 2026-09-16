import React, { PropsWithChildren } from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, gradients } from '../../theme';
import { Stars } from '../decor/Lanterns';

type Props = PropsWithChildren<{
  /** Night-sky gradient with stars (Clubs screens) or flat violet (profile/store). */
  variant?: 'sky' | 'flat';
  edges?: Edge[];
  style?: ViewStyle;
}>;

/** Base wrapper for every screen: background, status bar and safe area. */
export function Screen({ variant = 'sky', edges = ['top', 'left', 'right'], style, children }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {variant === 'sky' ? (
        <LinearGradient
          colors={gradients.screen}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {variant === 'sky' ? (
        <View pointerEvents="none" style={styles.stars}>
          <Stars />
        </View>
      ) : null}
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.screen,
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  safe: {
    flex: 1,
  },
});
