import { StyleSheet } from 'react-native';

import { colors, moderateScale, palette, radius, spacing } from '../../theme';

const UPPER_BAND_HEIGHT = moderateScale(150);

export const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    zIndex: 2,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  upperBand: {
    position: 'absolute',
    top: -moderateScale(120),
    left: 0,
    right: 0,
    height: UPPER_BAND_HEIGHT + moderateScale(120),
    backgroundColor: palette.violet950,
  },
  seam: {
    position: 'absolute',
    top: UPPER_BAND_HEIGHT,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.borderGold,
    opacity: 0.8,
  },
  header: {
    alignItems: 'center',
    paddingTop: UPPER_BAND_HEIGHT - moderateScale(48),
    paddingHorizontal: spacing.lg,
  },
  avatarBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    maxWidth: '86%',
  },
  signature: {
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: moderateScale(26),
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '48%',
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  viewsPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  ribbon: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  tile: {
    marginHorizontal: spacing.lg,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  columnBody: {
    minHeight: moderateScale(64),
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: spacing.xs,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  achievementTile: {
    flex: 1,
  },
  achievementBody: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    minHeight: moderateScale(96),
    justifyContent: 'space-between',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarAction: {
    marginBottom: spacing.md,
  },
});
