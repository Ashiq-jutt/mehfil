import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '../../store/toastStore';
import { colors, moderateScale, radius, shadows, spacing } from '../../theme';
import { Icon, IconName } from '../icons/Icon';
import { AppText } from './AppText';

const ICONS: Record<'info' | 'success' | 'error', IconName> = {
  info: 'info',
  success: 'check',
  error: 'alert',
};

/** Renders queued toasts as dark pills near the top of the screen (mount once at the root). */
export function ToastHost() {
  const toasts = useToastStore(s => s.toasts);
  const dismiss = useToastStore(s => s.dismiss);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + moderateScale(64) }]}>
      {toasts.map(t => (
        <Pressable key={t.id} onPress={() => dismiss(t.id)} style={[styles.pill, t.kind === 'error' ? styles.error : null]}>
          <Icon name={ICONS[t.kind]} size={moderateScale(16)} color={t.kind === 'success' ? colors.online : colors.white} />
          <AppText variant="label" shadow>
            {t.message}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(12, 4, 30, 0.92)',
    borderColor: colors.borderGold,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxWidth: '86%',
    ...shadows.card,
  },
  error: {
    borderColor: colors.danger,
  },
});
