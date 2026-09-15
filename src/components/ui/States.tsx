import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, moderateScale, radius, spacing } from '../../theme';
import { Icon, IconName } from '../icons/Icon';
import { AppText } from './AppText';
import { Button } from './Buttons';

type StateProps = {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Empty / error placeholder used inside lists and tabs. */
export function EmptyState({ icon = 'info', title, message, actionLabel, onAction, style }: StateProps) {
  return (
    <View style={[styles.center, style]}>
      <View style={styles.iconBubble}>
        <Icon name={icon} size={moderateScale(28)} color={colors.textMuted} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="textMuted" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export function ErrorState(props: Omit<StateProps, 'icon'>) {
  return <EmptyState icon="alert" {...props} />;
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
      {label ? (
        <AppText variant="caption" color="textMuted" style={styles.message}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

/** Inline banner for recoverable errors (login failures, network). */
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <View style={styles.banner}>
      <Icon name="alert" size={moderateScale(18)} color={colors.white} />
      <AppText variant="caption" style={styles.bannerText}>
        {message}
      </AppText>
      {onDismiss ? (
        <AppText variant="label" onPress={onDismiss}>
          OK
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconBubble: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    marginTop: spacing.xxs,
  },
  action: {
    marginTop: spacing.md,
    minWidth: moderateScale(160),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  bannerText: {
    flex: 1,
  },
});
