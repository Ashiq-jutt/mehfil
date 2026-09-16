import { palette } from './palette';

/** Reusable gradient stops for react-native-linear-gradient. */
export const gradients = {
  /** Night sky header → violet body, used behind every screen. */
  screen: [palette.sky900, palette.violet900, palette.violet900] as string[],
  /** Profile / store tiles. */
  tile: [palette.violet600, palette.violet400] as string[],
  /** Magenta dialog cards. */
  modal: [palette.plum300, palette.plum700] as string[],
  /** Green primary button. */
  primary: [palette.green400, palette.green600] as string[],
  /** Red close / danger button. */
  danger: [palette.red400, palette.red600] as string[],
  /** Gold rings & ribbons. */
  gold: [palette.gold300, palette.gold500, palette.gold700] as string[],
  /** Pink section ribbon ("Achievements"). */
  ribbon: [palette.red400, palette.red600] as string[],
  /** Pill tab bar. */
  tabBar: [palette.plum500, palette.plum700] as string[],
} as const;
