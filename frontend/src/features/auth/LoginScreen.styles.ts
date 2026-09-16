import { StyleSheet } from 'react-native';

import { colors, moderateScale, radius, shadows, spacing } from '../../theme';

export const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  brand: {
    letterSpacing: 1.5,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  card: {
    paddingTop: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  error: {
    marginBottom: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: moderateScale(50),
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    ...shadows.button,
  },
  googleLabel: {
    color: '#1F1235',
  },
  hint: {
    marginTop: spacing.sm,
  },
  devButton: {
    marginTop: spacing.md,
  },
  terms: {
    marginTop: spacing.md,
  },
});
