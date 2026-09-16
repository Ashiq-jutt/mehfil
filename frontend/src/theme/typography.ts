import { TextStyle } from 'react-native';

import { moderateScale } from './metrics';

/**
 * Font family names match the TTF file names in src/assets/fonts (Android) and the
 * PostScript names embedded in those files (iOS), so the same string works on both.
 */
export const fonts = {
  displayBold: 'Fredoka-Bold',
  displaySemiBold: 'Fredoka-SemiBold',
  displayMedium: 'Fredoka-Medium',
  body: 'Nunito-Regular',
  bodySemiBold: 'Nunito-SemiBold',
  bodyBold: 'Nunito-Bold',
  bodyExtraBold: 'Nunito-ExtraBold',
} as const;

export type TypographyVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'tiny';

export const typography: Record<TypographyVariant, TextStyle> = {
  hero: {
    fontFamily: fonts.displayBold,
    fontSize: moderateScale(40),
    lineHeight: moderateScale(46),
    letterSpacing: 0.5,
  },
  display: {
    fontFamily: fonts.displayBold,
    fontSize: moderateScale(28),
    lineHeight: moderateScale(34),
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: moderateScale(22),
    lineHeight: moderateScale(28),
  },
  heading: {
    fontFamily: fonts.displaySemiBold,
    fontSize: moderateScale(18),
    lineHeight: moderateScale(24),
  },
  subheading: {
    fontFamily: fonts.displayMedium,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
  },
  body: {
    fontFamily: fonts.body,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(21),
  },
  bodyStrong: {
    fontFamily: fonts.bodyBold,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(21),
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  caption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  tiny: {
    fontFamily: fonts.bodyBold,
    fontSize: moderateScale(10),
    lineHeight: moderateScale(13),
  },
};
