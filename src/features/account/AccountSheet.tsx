import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, Button, DialogCard, HeartsPill } from '../../components';
import { useMe } from '../../hooks/useMe';
import { useAuthStore } from '../../store/authStore';
import { colors, moderateScale, radius, spacing } from '../../theme';

type Props = { visible: boolean; onClose: () => void };

/** Minimal account card (the full profile screen arrives in phase 3). */
export function AccountSheet({ visible, onClose }: Props) {
  const { user } = useMe();
  const signOut = useAuthStore(s => s.signOut);
  const isBusy = useAuthStore(s => s.isBusy);

  return (
    <DialogCard visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <AvatarRing uri={user?.avatarUrl} size={moderateScale(84)} />
        <AppText variant="title" shadow style={styles.name}>
          {user?.displayName ?? '—'}
        </AppText>
        <View style={styles.idPill}>
          <AppText variant="caption" color="textSecondary">
            ID: {user?.id ?? '—'}
          </AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          {user?.email}
        </AppText>
        <HeartsPill value={user?.heartsBalance ?? 0} style={styles.hearts} />
      </View>

      <Button label="Sign out" variant="danger" icon="logout" loading={isBusy} onPress={signOut} />
      <AppText variant="tiny" color="textMuted" align="center" style={styles.footer}>
        Mehfil · phase 2 build
      </AppText>
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  name: {
    marginTop: spacing.sm,
  },
  idPill: {
    backgroundColor: colors.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hearts: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
  },
});
