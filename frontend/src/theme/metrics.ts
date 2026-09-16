import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Design baseline taken from the reference recordings (390 × 844 logical points).
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/** Scale horizontally with screen width. */
export const scale = (size: number) =>
  PixelRatio.roundToNearestPixel((width / BASE_WIDTH) * size);

/** Scale vertically with screen height. */
export const verticalScale = (size: number) =>
  PixelRatio.roundToNearestPixel((height / BASE_HEIGHT) * size);

/** Softer scaling for fonts/paddings so tablets don't blow up. */
export const moderateScale = (size: number, factor = 0.5) =>
  PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);

export const spacing = {
  xxs: moderateScale(2),
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(24),
  xxl: moderateScale(32),
  xxxl: moderateScale(48),
} as const;

export const radius = {
  xs: moderateScale(6),
  sm: moderateScale(10),
  md: moderateScale(14),
  lg: moderateScale(18),
  xl: moderateScale(24),
  xxl: moderateScale(32),
  pill: 999,
} as const;

export const screen = { width, height } as const;

/** Standard elevation/shadow presets. */
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;
