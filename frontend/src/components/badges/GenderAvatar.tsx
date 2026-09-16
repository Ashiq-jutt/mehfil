import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { fonts, palette } from '../../theme';
import type { Gender } from '../../api/types';

const COLORS: Record<Exclude<Gender, 'Unspecified'>, string> = {
  Male: '#3B82F6',
  Female: '#EC4899',
  Undisclosed: '#7C3AED',
};

type Props = { gender: Exclude<Gender, 'Unspecified'>; size?: number; dimmed?: boolean };

/** Head-and-shoulders silhouette in a coloured circle for the gender picker. */
export function GenderAvatar({ gender, size = 64, dimmed = false }: Props) {
  const color = COLORS[gender];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={dimmed ? 0.45 : 1}>
      <Circle cx="32" cy="32" r="30" fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      {gender === 'Undisclosed' ? (
        <SvgText x="32" y="42" fontSize="28" fontFamily={fonts.displayBold} fontWeight="700" fill={palette.white} textAnchor="middle">
          ?
        </SvgText>
      ) : (
        <>
          <Circle cx="32" cy="26" r="10" fill={palette.white} />
          <Path d="M14 54c2-10 9-15 18-15s16 5 18 15z" fill={palette.white} />
          {gender === 'Female' ? <Path d="M20 26c0-9 5-14 12-14s12 5 12 14c0 6-2 10-4 12H24c-2-2-4-6-4-12z" fill="#2B1A4A" opacity={0.65} /> : null}
          {gender === 'Male' ? <Path d="M21 24c0-7 5-11 11-11s11 4 11 11c-4-3-7-4-11-4s-7 1-11 4z" fill="#2B1A4A" opacity={0.65} /> : null}
        </>
      )}
    </Svg>
  );
}
