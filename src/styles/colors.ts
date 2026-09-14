// Original VoxNest palette: deep night-teal base with a warm saffron accent.
const palette = {
  ink950: '#070B10',
  ink900: '#0C131B',
  ink800: '#131D28',
  ink700: '#1C2A38',
  ink600: '#2A3B4C',
  ink400: '#6B7F92',
  ink200: '#B8C5D1',
  ink50: '#F2F6F9',

  saffron500: '#F5A524',
  saffron400: '#F8BA52',
  saffron700: '#B8740C',

  teal500: '#1FC8B4',
  teal400: '#4DDBC9',

  rose500: '#F25C7A',
  green500: '#3DD68C',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const colors = {
  background: palette.ink950,
  surface: palette.ink900,
  surfaceRaised: palette.ink800,
  border: palette.ink700,
  borderStrong: palette.ink600,

  textPrimary: palette.ink50,
  textSecondary: palette.ink200,
  textMuted: palette.ink400,
  textOnAccent: palette.ink950,

  accent: palette.saffron500,
  accentPressed: palette.saffron700,
  accentSoft: palette.saffron400,

  speaking: palette.teal500,
  online: palette.green500,
  danger: palette.rose500,
  success: palette.green500,
  warning: palette.saffron400,

  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,
  overlay: 'rgba(7, 11, 16, 0.72)',
} as const;

export type ColorToken = keyof typeof colors;
