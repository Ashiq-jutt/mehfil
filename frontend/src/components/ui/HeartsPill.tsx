import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, moderateScale, radius, spacing } from '../../theme';
import { formatCompact } from '../../utils/format';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type Props = {
  value: number;
  onPressAdd?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Hearts balance with the green "+" that opens the Shop. */
export function HeartsPill({ value, onPressAdd, style }: Props) {
  return (
    <View style={[styles.pill, style]}>
      <View style={styles.heartBadge}>
        <Icon name="heart" size={moderateScale(16)} color={colors.hearts} />
      </View>
      <AppText variant="label" style={styles.value}>
        {formatCompact(value)}
      </AppText>
      {onPressAdd ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Buy hearts" hitSlop={8} onPress={onPressAdd} style={styles.plus}>
          <Icon name="plus" size={moderateScale(12)} color={colors.white} strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: moderateScale(30),
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  heartBadge: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: moderateScale(28),
    textAlign: 'center',
  },
  plus: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
