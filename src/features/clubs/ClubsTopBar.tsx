import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, HeartsPill, Icon, IconButton } from '../../components';
import { useMe } from '../../hooks/useMe';
import { colors, moderateScale, spacing } from '../../theme';

type Props = {
  onPressAvatar: () => void;
  onPressAccount: () => void;
};

const comingSoon = (feature: string, phase: number) =>
  Alert.alert(feature, `${feature} arrives in phase ${phase}.`);

/** Avatar · hearts balance · Store · Leaderboard · account, mirroring the reference header. */
export function ClubsTopBar({ onPressAvatar, onPressAccount }: Props) {
  const { user } = useMe();

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={onPressAvatar} hitSlop={6}>
        <AvatarRing uri={user?.avatarUrl} size={moderateScale(44)} />
      </Pressable>

      <HeartsPill value={user?.heartsBalance ?? 0} onPressAdd={() => comingSoon('Shop', 8)} style={styles.hearts} />

      <View style={styles.spacer} />

      <TopAction icon="store" label="Store" onPress={() => comingSoon('Club Store', 10)} />
      <TopAction icon="trophy" label="Leaderboard" onPress={() => comingSoon('Leaderboard', 9)} />
      <IconButton icon="gear" accessibilityLabel="Account" onPress={onPressAccount} size={moderateScale(36)} />
    </View>
  );
}

function TopAction({ icon, label, onPress }: { icon: 'store' | 'trophy'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action} hitSlop={4}>
      <Icon name={icon} size={moderateScale(26)} color={colors.accent} />
      <AppText variant="tiny" color="textSecondary" shadow>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    minHeight: moderateScale(72),
  },
  hearts: {
    marginLeft: spacing.xxs,
  },
  spacer: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(52),
    gap: 2,
  },
});
