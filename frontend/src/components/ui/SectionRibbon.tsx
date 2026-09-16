import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { colors, gradients, moderateScale, radius, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = { label: string; style?: StyleProp<ViewStyle> };

/** Pink ribbon section label with fading side lines ("Achievements", "Game Stats"). */
export function SectionRibbon({ label, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <LinearGradient colors={gradients.ribbon} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.ribbon}>
        <AppText variant="label" shadow>
          {label}
        </AppText>
      </LinearGradient>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.borderStrong,
    maxWidth: moderateScale(48),
  },
  ribbon: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
});
