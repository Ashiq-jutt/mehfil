import { StyleSheet } from 'react-native';

import { colors, moderateScale, palette, radius, shadows, spacing } from '../../theme';

export const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    ...shadows.card,
  },
  coverWrap: {
    aspectRatio: 0.88,
    backgroundColor: colors.tile,
  },
  countPill: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  countPillLive: {
    backgroundColor: 'rgba(213,27,84,0.85)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
  },
  mineRibbon: {
    position: 'absolute',
    top: spacing.xs,
    left: 0,
    backgroundColor: palette.gold500,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderTopRightRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  levelBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    minWidth: moderateScale(22),
    height: moderateScale(22),
    paddingHorizontal: 4,
    borderRadius: moderateScale(11),
    backgroundColor: palette.gold400,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryChip: {
    backgroundColor: colors.tileRaised,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  metaSpacer: {
    flex: 1,
  },
});
