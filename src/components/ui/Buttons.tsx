import React, { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { colors, gradients, moderateScale, radius, shadows, spacing } from '../../theme';
import { Icon, IconName } from '../icons/Icon';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: IconName;
  iconNode?: React.ReactNode;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const variantGradient: Record<Exclude<ButtonVariant, 'ghost'>, string[]> = {
  primary: gradients.primary,
  secondary: gradients.modal,
  danger: gradients.danger,
};

/** Rounded gradient button (green Confirm / GO, magenta secondary, red Exit). */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  icon,
  iconNode,
  size = 'md',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'lg' ? moderateScale(54) : moderateScale(46);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonShell,
        { height, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        variant !== 'ghost' ? shadows.button : null,
        style,
      ]}
      {...rest}>
      {variant === 'ghost' ? (
        <View style={[styles.fill, styles.ghost]}>
          <ButtonContent label={label} loading={loading} icon={icon} iconNode={iconNode} />
        </View>
      ) : (
        <LinearGradient
          colors={variantGradient[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.fill, styles.gradient]}>
          <View style={styles.highlight} />
          <ButtonContent label={label} loading={loading} icon={icon} iconNode={iconNode} />
        </LinearGradient>
      )}
    </Pressable>
  );
}

function ButtonContent({
  label,
  loading,
  icon,
  iconNode,
}: Pick<ButtonProps, 'label' | 'loading' | 'icon' | 'iconNode'>) {
  return (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {iconNode ?? (icon ? <Icon name={icon} size={20} color={colors.white} /> : null)}
          <AppText variant="heading" color="textPrimary" shadow style={styles.label}>
            {label}
          </AppText>
        </>
      )}
    </View>
  );
}

type IconButtonProps = Omit<PressableProps, 'style'> & {
  icon: IconName;
  size?: number;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
};

/** Round icon button (search, share, follow-heart …). */
export function IconButton({
  icon,
  size = moderateScale(40),
  color = colors.textPrimary,
  background = 'rgba(0,0,0,0.28)',
  style,
  ...rest
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
      {...rest}>
      <Icon name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

/** The red circular close button from the reference design. */
export function CloseButton({ style, size = moderateScale(34), ...rest }: Omit<IconButtonProps, 'icon'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={8}
      style={({ pressed }) => [styles.closeShell, { width: size, height: size, opacity: pressed ? 0.8 : 1 }, style]}
      {...rest}>
      <LinearGradient colors={gradients.danger} style={[styles.closeGradient, { borderRadius: size / 2 }]}>
        <Icon name="close" size={size * 0.55} color={colors.white} strokeWidth={3} />
      </LinearGradient>
    </Pressable>
  );
}

/** Small pill used inside panels ("Use", "Rules", "Report"). */
export function PillButton({
  children,
  active = false,
  style,
  ...rest
}: PropsWithChildren<Omit<PressableProps, 'style'> & { active?: boolean; style?: StyleProp<ViewStyle> }>) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        active ? styles.pillActive : null,
        { opacity: pressed ? 0.8 : 1 },
        style,
      ]}
      {...rest}>
      {typeof children === 'string' ? (
        <AppText variant="label" color="textPrimary">
          {children}
        </AppText>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonShell: {
    borderRadius: radius.md,
    overflow: 'visible',
  },
  fill: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gradient: {
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: colors.border,
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  label: {
    letterSpacing: 0.3,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeShell: {
    ...shadows.button,
  },
  closeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.tileRaised,
    borderColor: colors.borderStrong,
  },
});
