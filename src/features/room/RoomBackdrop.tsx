import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { palette } from '../../theme';

/** Original decorative backdrop for the room: night skyline, glowing pedestal and a trophy silhouette. */
export function RoomBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.violet950} />
            <Stop offset="0.55" stopColor={palette.violet900} />
            <Stop offset="1" stopColor={palette.plum900} />
          </LinearGradient>
          <LinearGradient id="trophy" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C98A3A" />
            <Stop offset="1" stopColor="#6B3F14" />
          </LinearGradient>
          <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.violet400} stopOpacity="0.35" />
            <Stop offset="1" stopColor={palette.violet400} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#sky)" />

        {/* stars */}
        {[
          [30, 300], [90, 340], [150, 310], [230, 330], [300, 300], [360, 350], [60, 400], [340, 420],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill={palette.gold200} opacity={0.5} />
        ))}

        {/* skyline */}
        <Path
          d="M0 700 L0 660 L30 660 L30 630 L55 630 L55 670 L80 670 L80 610 L110 610 L110 650 L135 650 L135 600 L160 600 L160 640 L190 640 L190 590 L215 590 L215 650 L245 650 L245 615 L270 615 L270 660 L300 660 L300 620 L330 620 L330 665 L360 665 L360 640 L390 640 L390 700 Z"
          fill={palette.violet950}
          opacity={0.9}
        />
        {[40, 92, 120, 172, 200, 255, 285, 340].map((x, i) => (
          <Rect key={`w${i}`} x={x} y={630 + (i % 3) * 14} width="5" height="7" fill={palette.gold300} opacity={0.35} />
        ))}

        {/* pedestal glow + base */}
        <Ellipse cx="195" cy="690" rx="150" ry="60" fill="url(#glow)" />
        <Ellipse cx="195" cy="700" rx="95" ry="22" fill={palette.plum800} />
        <Ellipse cx="195" cy="694" rx="80" ry="16" fill="#3E7A3A" opacity={0.9} />
        <Ellipse cx="195" cy="690" rx="62" ry="11" fill="#5FA657" opacity={0.9} />

        {/* trophy */}
        <Rect x="170" y="655" width="50" height="14" rx="4" fill="url(#trophy)" />
        <Rect x="184" y="615" width="22" height="42" rx="6" fill="url(#trophy)" />
        <Path d="M140 470 C138 560 165 600 195 610 C225 600 252 560 250 470 Z" fill="url(#trophy)" />
        <Path d="M140 480 C110 485 105 530 140 545 M250 480 C280 485 285 530 250 545" stroke="#B9782E" strokeWidth="9" fill="none" strokeLinecap="round" />
        <Rect x="132" y="462" width="126" height="16" rx="6" fill="#D9A04A" />
        <Circle cx="195" cy="530" r="26" fill="#F3D48A" opacity={0.95} />
        <Path d="M187 545 L203 545 M203 515 L188 515 L200 530 L188 545" stroke="#8A5A1E" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
