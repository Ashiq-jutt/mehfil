/**
 * Raw colour scale sampled from the reference recordings (deep violet night sky,
 * magenta panels, gold titles, green CTAs, red close buttons, pink hearts).
 * Prefer the semantic tokens in ./colors.ts inside components.
 */
export const palette = {
  // Night sky header gradient
  sky900: '#0A1655',
  sky800: '#142370',

  // Violet screen backgrounds & tiles
  violet950: '#170733',
  violet900: '#2A0D54',
  violet800: '#3A1470',
  violet700: '#4B1E8E',
  violet600: '#5E23B9',
  violet500: '#7A3FD6',
  violet400: '#935FE9',
  violet300: '#A67FF6',
  violet200: '#C9B3FA',

  // Plum / magenta panels, tabs and modals
  plum950: '#26081F',
  plum900: '#310F3B',
  plum800: '#3F0F30',
  plum700: '#4C0F39',
  plum600: '#6C144B',
  plum500: '#771A52',
  plum400: '#8A3067',
  plum300: '#961E60',
  plum200: '#B26196',
  plum100: '#E098C6',

  // Accents
  gold700: '#B8740C',
  gold600: '#DDA535',
  gold500: '#F6AC19',
  gold400: '#FFC94A',
  gold300: '#FFD66B',
  gold200: '#FFE9A8',

  green700: '#3E8F2A',
  green600: '#4EA236',
  green500: '#5CC240',
  green400: '#7ED957',

  red700: '#A30E33',
  red600: '#C2143F',
  red500: '#D51B54',
  red400: '#F04A6E',

  pink500: '#FF5C9E',
  pink400: '#FF7DB5',
  pink200: '#FFC2DA',

  teal400: '#4DDBC9',
  blue500: '#3B82F6',

  white: '#FFFFFF',
  black: '#000000',
} as const;
