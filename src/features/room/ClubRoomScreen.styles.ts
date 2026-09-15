import { StyleSheet } from 'react-native';

import { colors, moderateScale, radius, spacing } from '../../theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.screen,
  },
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  middle: {
    flex: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  chatColumn: {
    flex: 1,
    paddingRight: moderateScale(60),
  },
  announcement: {
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(109, 94, 134, 0.55)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 2,
  },
  reconnecting: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(213,27,84,0.5)',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  reconnectButton: {
    alignSelf: 'flex-start',
    height: moderateScale(32),
  },
});
