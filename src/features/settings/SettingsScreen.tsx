import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText, AvatarRing, Button, CloseButton, HeartsPill, Icon, Panel, Screen, SectionRibbon } from '../../components';
import { usersApi } from '../../api';
import { useMe } from '../../hooks/useMe';
import { useNotificationSettings, useUnreadCount, useUpdateNotificationSettings } from '../../hooks/useNotifications';
import type { MainStackScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { colors, moderateScale, palette, radius, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { BlockedUsersDialog } from './BlockedUsersDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import type { NotificationSettingsDto } from '../../api/types';

const TOGGLES: Array<{ key: keyof NotificationSettingsDto; label: string; hint: string }> = [
  { key: 'pushGifts', label: 'Gifts', hint: 'When someone sends you a gift' },
  { key: 'pushFollows', label: 'Followers', hint: 'When someone follows your club' },
  { key: 'pushRewards', label: 'Leaderboard rewards', hint: 'When you win a daily or weekly rank' },
  { key: 'pushSystem', label: 'Club & system', hint: 'Admin rights, moderation and announcements' },
];

/** Settings: account card, notifications, push preferences, blocked users, sign out and account deletion. */
export function SettingsScreen({ navigation }: MainStackScreenProps<'Settings'>) {
  const { user } = useMe();
  const unread = useUnreadCount();
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const signOut = useAuthStore(s => s.signOut);
  const isBusy = useAuthStore(s => s.isBusy);
  const [blocked, setBlocked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const toggle = (key: keyof NotificationSettingsDto, value: boolean) => {
    if (settings.data) {
      update.mutate({ ...settings.data, [key]: value });
    }
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    try {
      await usersApi.deleteMe();
      toast.info('Your account has been deleted.');
      await signOut();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeleteBusy(false);
      setDeleting(false);
    }
  };

  return (
    <Screen variant="flat">
      <View style={styles.topBar}>
        <AppText variant="title" color="textGold" shadow>
          Settings
        </AppText>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Panel variant="tile">
          <View style={styles.account}>
            <AvatarRing uri={resolveAssetUrl(user?.avatarUrl)} size={moderateScale(72)} />
            <View style={styles.accountText}>
              <AppText variant="heading" shadow numberOfLines={1}>
                {user?.displayName ?? '—'}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                ID: {user?.id ?? '—'}
              </AppText>
              <AppText variant="tiny" color="textMuted" numberOfLines={1}>
                {user?.email}
              </AppText>
            </View>
            <HeartsPill value={user?.heartsBalance ?? 0} onPressAdd={() => navigation.navigate('Shop')} />
          </View>
          <Button label="Edit profile" variant="secondary" onPress={() => navigation.navigate('Profile')} style={styles.profileButton} />
        </Panel>

        <SectionRibbon label="Notifications" style={styles.ribbon} />
        <Row label="Inbox" hint={unread > 0 ? `${unread} unread` : 'All caught up'} badge={unread} onPress={() => navigation.navigate('Notifications')} />
        <View style={styles.group}>
          {TOGGLES.map(t => (
            <View key={t.key} style={styles.toggleRow}>
              <View style={styles.text}>
                <AppText variant="label">{t.label}</AppText>
                <AppText variant="tiny" color="textMuted">
                  {t.hint}
                </AppText>
              </View>
              <Switch
                accessibilityLabel={`Push: ${t.label}`}
                value={settings.data?.[t.key] ?? true}
                disabled={!settings.data}
                onValueChange={value => toggle(t.key, value)}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.primary }}
                thumbColor={palette.white}
              />
            </View>
          ))}
        </View>

        <SectionRibbon label="Privacy" style={styles.ribbon} />
        <Row label="Blocked users" hint="Manage who can't reach you" onPress={() => setBlocked(true)} />

        <SectionRibbon label="Account" style={styles.ribbon} />
        <Button label="Sign out" variant="danger" icon="logout" loading={isBusy} onPress={signOut} />
        <Button label="Delete account" variant="ghost" onPress={() => setDeleting(true)} style={styles.delete} />
        <AppText variant="tiny" color="textMuted" align="center" style={styles.footer}>
          Mehfil · phase 11 build
        </AppText>
      </ScrollView>

      <BlockedUsersDialog visible={blocked} onClose={() => setBlocked(false)} />
      <DeleteAccountDialog visible={deleting} busy={deleteBusy} onClose={() => setDeleting(false)} onConfirm={deleteAccount} />
    </Screen>
  );
}

function Row({ label, hint, badge = 0, onPress }: { label: string; hint?: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={styles.text}>
        <AppText variant="label">{label}</AppText>
        {hint ? (
          <AppText variant="tiny" color="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {badge > 0 ? (
        <View style={styles.badge}>
          <AppText variant="tiny">{badge > 99 ? '99+' : badge}</AppText>
        </View>
      ) : null}
      <Icon name="chevronRight" size={moderateScale(18)} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accountText: {
    flex: 1,
  },
  profileButton: {
    marginTop: spacing.md,
  },
  ribbon: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  group: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
  },
  badge: {
    minWidth: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    paddingHorizontal: 6,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
