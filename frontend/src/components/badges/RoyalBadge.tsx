import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { fonts, palette } from '../../theme';
import type { PrimeLevel, RoyalLevel } from '../../api/types';

const ROYAL_COLORS: Record<Exclude<RoyalLevel, 'None'>, [string, string]> = {
  R1: ['#F6A0B4', '#C93A63'],
  R2: ['#9CC9FF', '#3B6FD6'],
  R3: ['#FFC58A', '#E0762B'],
  R4: ['#C9A6FF', '#7A3FD6'],
  R5: ['#FF9BD6', '#C42B8B'],
  R6: ['#A6F2C8', '#1F9D6A'],
};

const PRIME_COLORS: Record<Exclude<PrimeLevel, 'None'>, [string, string]> = {
  P1: ['#FFE9A8', '#DDA535'],
  P2: ['#E6E6FA', '#8F8FD9'],
  P3: ['#FFD1FB', '#B04AC9'],
};

type Props = {
  level: RoyalLevel | PrimeLevel;
  size?: number;
  /** Greyed-out crest with no label (not yet achieved / no royalty). */
  locked?: boolean;
};

let gradientId = 0;

/** Original crest badge for Royal (R1–R6) and Prime (P1–P3) tiers. */
export function RoyalBadge({ level, size = 56, locked = false }: Props) {
  const id = React.useMemo(() => `royal-${gradientId++}`, []);
  const isPrime = level.startsWith('P');
  const colors =
    locked || level === 'None'
      ? (['#8B84A3', '#4B4560'] as [string, string])
      : isPrime
      ? PRIME_COLORS[level as Exclude<PrimeLevel, 'None'>]
      : ROYAL_COLORS[level as Exclude<RoyalLevel, 'None'>];
  const label = locked || level === 'None' ? '' : level;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      {/* laurel wings */}
      <Path
        d="M14 22c-6 4-9 12-6 20 2-2 3-5 4-8 1 4 3 8 7 10-2-4-3-9-2-14 2 3 5 5 9 6-4-4-7-9-8-14z"
        fill={locked ? '#6E6787' : palette.gold500}
        opacity={0.9}
      />
      <Path
        d="M50 22c6 4 9 12 6 20-2-2-3-5-4-8-1 4-3 8-7 10 2-4 3-9 2-14-2 3-5 5-9 6 4-4 7-9 8-14z"
        fill={locked ? '#6E6787' : palette.gold500}
        opacity={0.9}
      />
      {/* shield */}
      <Path
        d="M32 8l16 6v14c0 12-7 20-16 26-9-6-16-14-16-26V14z"
        fill={`url(#${id})`}
        stroke={locked ? '#B9B3CC' : palette.gold300}
        strokeWidth={2.5}
      />
      {isPrime ? (
        <Path d="M32 14l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="rgba(255,255,255,0.28)" />
      ) : (
        <Path d="M22 22h20l-3 6H25z" fill="rgba(255,255,255,0.25)" />
      )}
      {label ? (
        <SvgText
          x="32"
          y="42"
          fontSize="17"
          fontFamily={fonts.displayBold}
          fontWeight="700"
          fill={palette.white}
          textAnchor="middle"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={0.8}>
          {label}
        </SvgText>
      ) : (
        <Path d="M32 24l3 7 7 .6-5.4 4.6 1.7 7L32 39.5 25.7 43l1.7-7L22 31.6l7-.6z" fill="rgba(255,255,255,0.35)" />
      )}
    </Svg>
  );
}
