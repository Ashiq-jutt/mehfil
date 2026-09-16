import { StyleSheet } from 'react-native';

import { colors, moderateScale, palette, radius, spacing } from '../../theme';

export const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  content: {
    paddingBottom: spacing.xxxl * 2,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  coverWrap: {
    width: moderateScale(112),
    height: moderateScale(112),
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.borderGold,
  },
  coverEdit: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  coverBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    maxWidth: '90%',
  },
  levelBadge: {
    minWidth: moderateScale(22),
    height: moderateScale(22),
    paddingHorizontal: 4,
    borderRadius: moderateScale(11),
    backgroundColor: palette.gold400,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  tabs: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  ribbon: {
    marginBottom: spacing.xs,
  },
  recordRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  recordTile: {
    flex: 1,
  },
  note: {
    marginTop: spacing.xs,
  },
  ownerCard: {
    backgroundColor: colors.panelSoft,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ownerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  ownerTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  adminCard: {},
  adminIcon: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcement: {
    gap: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.panelSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  tagAccent: {
    backgroundColor: colors.tileRaised,
  },
  smallActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reportInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(42, 13, 84, 0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
