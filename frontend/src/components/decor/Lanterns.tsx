import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { palette, scale } from '../../theme';

type LanternProps = { size?: number; height?: number };

/** A single hanging lantern (original artwork) used along the top of Clubs screens. */
export function Lantern({ size = 34, height = 70 }: LanternProps) {
  const w = size;
  const cordLength = height - size * 1.6;
  return (
    <Svg width={w} height={height} viewBox={`0 0 34 ${(height / w) * 34}`}>
      <Path d={`M17 0v${(cordLength / w) * 34}`} stroke={palette.gold400} strokeWidth={1.4} />
      {(() => {
        const top = (cordLength / w) * 34;
        return (
          <>
            <Rect x="12" y={top} width="10" height="4" rx="1.5" fill={palette.gold500} />
            <Ellipse cx="17" cy={top + 20} rx="15" ry="16" fill={palette.red500} />
            <Ellipse cx="17" cy={top + 20} rx="10" ry="16" fill={palette.red400} opacity={0.6} />
            <Path d={`M7 ${top + 12}h20M7 ${top + 28}h20`} stroke={palette.gold400} strokeWidth={1.2} opacity={0.8} />
            <Rect x="12" y={top + 34} width="10" height="4" rx="1.5" fill={palette.gold500} />
            <Path d={`M14 ${top + 38}v7M17 ${top + 38}v9M20 ${top + 38}v7`} stroke={palette.gold400} strokeWidth={1.4} strokeLinecap="round" />
            <Circle cx="17" cy={top + 20} r="4" fill={palette.gold200} opacity={0.55} />
          </>
        );
      })()}
    </Svg>
  );
}

/** Two lanterns hanging from the top corners, like the reference Clubs header. */
export function LanternsHeader() {
  return (
    <View pointerEvents="none" style={styles.row}>
      <Lantern size={scale(30)} height={scale(78)} />
      <Lantern size={scale(30)} height={scale(64)} />
    </View>
  );
}

/** Small scattered star field for the night-sky header. */
export function Stars() {
  const stars = [
    [8, 12, 1.4],
    [22, 30, 1],
    [40, 8, 1.2],
    [58, 26, 0.9],
    [75, 14, 1.5],
    [90, 34, 1],
    [30, 46, 0.8],
    [66, 44, 1.1],
  ] as const;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox="0 0 100 60" preserveAspectRatio="none">
      {stars.map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r * 0.6} fill={palette.gold200} opacity={0.75} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(52),
  },
});
