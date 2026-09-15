import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { colors, moderateScale, radius, spacing } from '../../theme';
import { Icon, IconName } from '../icons/Icon';
import { AppText } from './AppText';

type ChipProps = {
  label: string;
  /** Emoji flag or an icon name. */
  emoji?: string;
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Country / filter chip (Global, Pakistan, More ≫). */
export function Chip({ label, emoji, icon, active = false, onPress, style }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, { opacity: pressed ? 0.8 : 1 }, style]}>
      {emoji ? <AppText variant="label">{emoji}</AppText> : null}
      {icon ? <Icon name={icon} size={moderateScale(14)} color={colors.chipText} /> : null}
      <AppText variant="label" color="chipText" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: moderateScale(30),
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  chipActive: {
    backgroundColor: colors.chipActive,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
