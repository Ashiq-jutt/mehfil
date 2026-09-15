import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { fonts, palette } from '../../theme';

type Props = { rank: number; size?: number };

const MEDALS: Record<number, { fill: string; ring: string; ribbon: string }> = {
  1: { fill: palette.gold500, ring: palette.gold300, ribbon: palette.red500 },
  2: { fill: '#B9C4D6', ring: '#E6ECF5', ribbon: palette.blue500 },
  3: { fill: '#C9803F', ring: '#F0B37A', ribbon: palette.green600 },
};

/** Ranks 1–3 are medals (gold / silver / bronze); every other rank is the green hex crest from the leaderboard. */
export function RankBadge({ rank, size = 32 }: Props) {
  const medal = MEDALS[rank];
  const label = rank > 200 ? '200+' : String(rank);
  const fontSize = label.length > 2 ? 11 : label.length > 1 ? 14 : 17;

  if (medal) {
    return (
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Path d="M12 2h7l-4 12h-7z" fill={medal.ribbon} />
        <Path d="M21 2h7l4 12h-7z" fill={medal.ribbon} />
        <Circle cx="20" cy="24" r="13" fill={medal.fill} stroke={medal.ring} strokeWidth={2.5} />
        <Circle cx="20" cy="24" r="9" fill="rgba(0,0,0,0.18)" />
        <SvgText x="20" y="29" fontSize={fontSize} fontFamily={fonts.displayBold} fontWeight="700" fill={palette.white} textAnchor="middle">
          {label}
        </SvgText>
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 3l14 8v18l-14 8-14-8V11z" fill={palette.green600} stroke={palette.green400} strokeWidth={2} />
      <Path d="M20 8l10 5.5v13L20 32l-10-5.5v-13z" fill="rgba(0,0,0,0.18)" />
      <SvgText x="20" y="25" fontSize={fontSize} fontFamily={fonts.displayBold} fontWeight="700" fill={palette.white} textAnchor="middle">
        {label}
      </SvgText>
    </Svg>
  );
}
