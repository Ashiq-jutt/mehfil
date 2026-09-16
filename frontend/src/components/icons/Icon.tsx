import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

export type IconName =
  | 'close'
  | 'search'
  | 'globe'
  | 'fire'
  | 'heart'
  | 'heartOutline'
  | 'plus'
  | 'store'
  | 'trophy'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'gear'
  | 'logout'
  | 'google'
  | 'copy'
  | 'share'
  | 'user'
  | 'mic'
  | 'micOff'
  | 'lock'
  | 'gift'
  | 'info'
  | 'check'
  | 'alert';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Original, minimal line icon set drawn for Mehfil. */
export function Icon({ name, size = 22, color = colors.textPrimary, strokeWidth = 2.2 }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (name) {
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 6l12 12M18 6L6 18" {...common} strokeWidth={strokeWidth + 0.6} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="10.5" cy="10.5" r="6.5" {...common} />
          <Path d="M15.5 15.5L21 21" {...common} />
        </Svg>
      );
    case 'globe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" {...common} strokeWidth={1.6} />
        </Svg>
      );
    case 'fire':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-1.5.6-2.6 1.4-3.5.3 1.2 1 2 2.1 2.3C11.5 8.5 10 6 12 3z"
            fill={color}
          />
          <Path d="M8 14.5c0 2.8 1.8 4.5 4 4.5s4-1.7 4-4.5" {...common} strokeWidth={1.4} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7 4.5c2 0 3.4 1 5 2.8 1.6-1.8 3-2.8 5-2.8 3.1 0 5.4 3.1 4.2 6.6C19.5 15.9 12 20.5 12 20.5z"
            fill={color}
          />
        </Svg>
      );
    case 'heartOutline':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7 4.5c2 0 3.4 1 5 2.8 1.6-1.8 3-2.8 5-2.8 3.1 0 5.4 3.1 4.2 6.6C19.5 15.9 12 20.5 12 20.5z"
            {...common}
          />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" {...common} strokeWidth={strokeWidth + 0.8} />
        </Svg>
      );
    case 'store':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 10.5h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" fill={color} />
          <Path d="M3 10.5 5.2 4h13.6L21 10.5" {...common} />
          <Path d="M10.5 20.5v-5h3v5" stroke={colors.tile} strokeWidth={1.6} fill={colors.tile} />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M7 4h10v5a5 5 0 0 1-10 0z" fill={color} />
          <Path d="M7 6H4.5a1 1 0 0 0-1 1c0 2.5 1.5 4 3.5 4.5M17 6h2.5a1 1 0 0 1 1 1c0 2.5-1.5 4-3.5 4.5" {...common} strokeWidth={1.8} />
          <Path d="M12 14v3M8.5 20.5h7L14 17h-4z" {...common} fill={color} strokeWidth={1.4} />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 5l7 7-7 7" {...common} />
        </Svg>
      );
    case 'chevronLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 5l-7 7 7 7" {...common} />
        </Svg>
      );
    case 'chevronDown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 9l7 7 7-7" {...common} />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="3" {...common} />
          <Path
            d="M12 2.5l1.6 2.3 2.7-.7.7 2.7 2.3 1.6-1.2 2.5 1.2 2.5-2.3 1.6-.7 2.7-2.7-.7L12 21.5l-1.6-2.3-2.7.7-.7-2.7-2.3-1.6 1.2-2.5-1.2-2.5 2.3-1.6.7-2.7 2.7.7z"
            {...common}
            strokeWidth={1.6}
          />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M15 8l4 4-4 4M19 12H9" {...common} />
        </Svg>
      );
    case 'google':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4z" fill="#4285F4" />
          <Path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
          <Path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05" />
          <Path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" fill="#EA4335" />
        </Svg>
      );
    case 'copy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="8" y="8" width="12" height="12" rx="2" {...common} />
          <Path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" {...common} />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="18" cy="5.5" r="2.5" {...common} />
          <Circle cx="6" cy="12" r="2.5" {...common} />
          <Circle cx="18" cy="18.5" r="2.5" {...common} />
          <Path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" {...common} />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="8.5" r="4" fill={color} />
          <Path d="M4.5 20.5c.8-4 3.9-6 7.5-6s6.7 2 7.5 6z" fill={color} />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
          <Path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" {...common} />
        </Svg>
      );
    case 'micOff':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="9" y="3" width="6" height="11" rx="3" {...common} strokeWidth={1.8} />
          <Path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6M4 4l16 16" {...common} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="5" y="10.5" width="14" height="10" rx="2" fill={color} />
          <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" {...common} />
        </Svg>
      );
    case 'gift':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="9" width="16" height="4" rx="1" fill={color} />
          <Rect x="5" y="13" width="14" height="8" rx="1.5" fill={color} opacity={0.85} />
          <Path d="M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z" {...common} stroke={colors.screen} strokeWidth={1.4} />
        </Svg>
      );
    case 'info':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 11v6M12 7.5v.5" {...common} />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 7" {...common} strokeWidth={strokeWidth + 0.8} />
        </Svg>
      );
    case 'alert':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3.5 21.5 20h-19z" {...common} />
          <Path d="M12 9.5v5M12 17.5v.5" {...common} />
        </Svg>
      );
    default:
      return null;
  }
}
