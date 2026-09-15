import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { fonts, palette } from '../../theme';

export type AchievementKind = 'topGifter' | 'topReceiver' | 'celebrity' | 'weeklyTopClub';

type Props = { kind: AchievementKind; size?: number; rank?: number };

const COLORS: Record<AchievementKind, { fill: string; ring: string }> = {
  topGifter: { fill: '#8F2C6C', ring: palette.gold400 },
  topReceiver: { fill: '#6A2C8F', ring: palette.gold400 },
  celebrity: { fill: '#C2143F', ring: palette.gold300 },
  weeklyTopClub: { fill: '#1F9D6A', ring: palette.gold400 },
};

/** Round rank crest ("1" medal) used for Top Gifter / Top Receiver / Celebrity tiles. */
export function AchievementBadge({ kind, size = 44, rank = 1 }: Props) {
  const { fill, ring } = COLORS[kind];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* ribbon tails */}
      <Path d="M17 30l-5 14 7-3 3 5 4-11z" fill={palette.red500} />
      <Path d="M31 30l5 14-7-3-3 5-4-11z" fill={palette.red500} />
      <Circle cx="24" cy="21" r="16" fill={fill} stroke={ring} strokeWidth={3} />
      <Circle cx="24" cy="21" r="11" fill="rgba(0,0,0,0.25)" />
      {kind === 'celebrity' ? (
        <Path d="M24 11l3 6.5 7 .8-5.2 4.8 1.4 7L24 26.6 17.8 30l1.4-7L14 18.3l7-.8z" fill={palette.gold300} />
      ) : (
        <SvgText
          x="24"
          y="27"
          fontSize="16"
          fontFamily={fonts.displayBold}
          fontWeight="700"
          fill={palette.gold200}
          textAnchor="middle">
          {rank}
        </SvgText>
      )}
    </Svg>
  );
}
