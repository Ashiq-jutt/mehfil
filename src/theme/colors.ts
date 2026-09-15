import { palette } from './palette';

/** Semantic colour tokens. Components use these, never the raw palette. */
export const colors = {
  // Backgrounds
  screen: palette.violet900,
  screenDeep: palette.plum900,
  skyTop: palette.sky900,
  skyBottom: palette.violet900,

  // Surfaces
  panel: palette.plum700,
  panelRaised: palette.plum600,
  panelSoft: palette.plum400,
  modal: palette.plum300,
  modalDeep: palette.plum800,
  tile: palette.violet700,
  tileRaised: palette.violet600,
  tileSoft: palette.violet300,
  input: 'rgba(0, 0, 0, 0.35)',
  overlay: 'rgba(10, 4, 24, 0.78)',

  // Borders
  border: 'rgba(255, 255, 255, 0.14)',
  borderStrong: 'rgba(255, 255, 255, 0.28)',
  borderGold: palette.gold500,
  borderMagenta: palette.plum200,

  // Text
  textPrimary: palette.white,
  textSecondary: '#EBDDF7',
  textMuted: '#B99BDD',
  textGold: palette.gold300,
  textGoldDeep: palette.gold500,
  textOnPrimary: palette.white,
  textOnGold: palette.violet950,
  textShadow: 'rgba(0, 0, 0, 0.55)',

  // Accents & actions
  accent: palette.gold500,
  accentSoft: palette.gold300,
  primary: palette.green500,
  primaryPressed: palette.green600,
  primaryDeep: palette.green700,
  secondary: palette.plum300,
  secondaryPressed: palette.plum500,
  danger: palette.red500,
  dangerPressed: palette.red600,
  hearts: palette.pink500,
  heartsSoft: palette.pink200,
  speaking: palette.teal400,
  online: palette.green400,
  info: palette.blue500,

  // Tabs & chips
  tabBar: palette.plum600,
  tabActive: '#F3DDEF',
  tabActiveText: palette.plum700,
  tabInactiveText: palette.plum100,
  chip: palette.plum200,
  chipActive: palette.violet600,
  chipText: palette.white,

  white: palette.white,
  black: palette.black,
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
