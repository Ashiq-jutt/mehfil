import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, HeartsPill, Icon, IconButton } from '../../components';
import { useMe } from '../../hooks/useMe';
import type { MainStackParamList } from '../../navigation/types';
import { colors, moderateScale, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';

type Props = {
  onPressAccount: () => void;
};

/** Avatar · hearts balance · Store · Leaderboard · account, mirroring the reference header. */
export function ClubsTopBar({ onPressAccount }: Props) {
  const { user } = useMe();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => navigation.navigate('Profile')} hitSlop={6}>
        <AvatarRing uri={resolveAssetUrl(user?.avatarUrl)} size={moderateScale(44)} />
      </Pressable>

      <HeartsPill value={user?.heartsBalance ?? 0} onPressAdd={() => navigation.navigate('Shop')} style={styles.hearts} />

      <View style={styles.spacer} />

      <TopAction icon="store" label="Store" onPress={() => navigation.navigate('ClubStore')} />
      <TopAction icon="trophy" label="Leaderboard" onPress={() => navigation.navigate('Leaderboard')} />
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
