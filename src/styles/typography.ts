import { TextStyle } from 'react-native';

import { moderateScale } from './metrics';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

export const typography: Record<Variant, TextStyle> = {
  display: {
    fontSize: moderateScale(32),
    lineHeight: moderateScale(38),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: moderateScale(24),
    lineHeight: moderateScale(30),
    fontWeight: '700',
  },
  heading: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(24),
    fontWeight: '700',
  },
  body: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(21),
    fontWeight: '400',
  },
  label: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    fontWeight: '600',
  },
  caption: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
    fontWeight: '500',
  },
};
