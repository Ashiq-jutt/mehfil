import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { colors, gradients, moderateScale, radius, spacing } from '../../theme';
import { Icon, IconName } from '../icons/Icon';
import { AppText } from './AppText';

export type PillTabItem = { key: string; label: string; icon?: IconName };

type Props = {
  items: PillTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Trailing element (e.g. the search button on Clubs Home). */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** The magenta tab strip with a raised light pill for the active tab (Explore / Hot / My). */
export function PillTabs({ items, activeKey, onChange, trailing, style }: Props) {
  return (
    <LinearGradient colors={gradients.tabBar} style={[styles.bar, style]}>
      {items.map(item => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [styles.tab, active ? styles.tabActive : null, { opacity: pressed ? 0.85 : 1 }]}>
            {item.icon ? (
              <Icon name={item.icon} size={moderateScale(15)} color={active ? colors.tabActiveText : colors.tabInactiveText} />
            ) : null}
            <AppText variant="label" style={{ color: active ? colors.tabActiveText : colors.tabInactiveText }}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: moderateScale(36),
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.tabActive,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  trailing: {
    marginLeft: spacing.xs,
  },
});
