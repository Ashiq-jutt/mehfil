import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { colors, gradients, radius, shadows, spacing } from '../../theme';

type Props = PropsWithChildren<{
  /** magenta = list/info panels, tile = violet stat tiles, modal = gold-bordered dialog card. */
  variant?: 'magenta' | 'tile' | 'modal' | 'dark';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

/** Rounded container with the design's inset border and gradient fills. */
export function Panel({ variant = 'magenta', padded = true, style, children }: Props) {
  const content = padded ? <View style={styles.padding}>{children}</View> : children;

  if (variant === 'tile') {
    return (
      <LinearGradient colors={gradients.tile} style={[styles.base, styles.tile, style]}>
        {content}
      </LinearGradient>
    );
  }

  if (variant === 'modal') {
    return (
      <LinearGradient colors={gradients.modal} style={[styles.base, styles.modal, style]}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.base, variant === 'dark' ? styles.dark : styles.magenta, style]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...shadows.card,
  },
  padding: {
    padding: spacing.lg,
  },
  magenta: {
    backgroundColor: colors.panelRaised,
    borderColor: colors.borderMagenta,
  },
  dark: {
    backgroundColor: colors.modalDeep,
    borderColor: colors.border,
  },
  tile: {
    borderColor: 'rgba(255,255,255,0.35)',
  },
  modal: {
    borderColor: colors.borderGold,
    borderWidth: 2.5,
  },
});
