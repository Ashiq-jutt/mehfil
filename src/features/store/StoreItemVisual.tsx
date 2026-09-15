import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { AppText, AvatarRing, Icon } from '../../components';
import { colors, moderateScale, palette, radius, spacing } from '../../theme';
import { backgroundTheme, bubbleTheme, cardColors, dpTint, entryStyle, frameColors } from './cosmetics';
import type { StoreItemKind } from '../../api/types';

type Props = {
  code: string;
  kind: StoreItemKind;
  size: number;
  /** Avatar shown inside frames (the caller's own picture in previews). */
  avatarUri?: string;
};

/** Generated preview of a store item at any size: frames ring an avatar, bubbles say hello, backgrounds show a mini room. */
export function StoreItemVisual({ code, kind, size, avatarUri }: Props) {
  switch (kind) {
    case 'Frame': {
      const frame = frameColors(code);
      const ring = size * 0.07;
      const avatar = <AvatarRing uri={avatarUri} size={size - ring * 2} ring="none" />;
      return frame ? (
        <LinearGradient colors={frame} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.frame, { width: size, height: size, borderRadius: size / 2, padding: ring }]}>
          {avatar}
        </LinearGradient>
      ) : (
        <View style={[styles.frame, styles.frameDefault, { width: size, height: size, borderRadius: size / 2, padding: ring }]}>{avatar}</View>
      );
    }
    case 'ChatBubble': {
      const theme = bubbleTheme(code);
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View style={[styles.bubble, theme ? { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor } : null]}>
            <AppText variant={size > 120 ? 'heading' : 'label'}>Hello!</AppText>
          </View>
        </View>
      );
    }
    case 'Background': {
      const theme = backgroundTheme(code);
      const w = size;
      const h = size * 1.15;
      return (
        <View style={[styles.scene, { width: w, height: h }]}>
          <LinearGradient colors={theme.sky} style={StyleSheet.absoluteFill} />
          <Svg width={w} height={h} viewBox="0 0 100 115">
            <Path d="M0 90 L0 76 L12 76 L12 66 L24 66 L24 80 L36 80 L36 60 L48 60 L48 74 L62 74 L62 64 L74 64 L74 78 L88 78 L88 70 L100 70 L100 90 Z" fill="rgba(0,0,0,0.35)" />
            <Ellipse cx="50" cy="96" rx="34" ry="9" fill={theme.ground[0]} />
            <Ellipse cx="50" cy="93" rx="24" ry="5" fill={theme.ground[1]} />
            <Rect x="44" y="70" width="12" height="18" rx="3" fill={theme.trophy[1]} />
            <Path d="M34 40 C33 62 42 70 50 72 C58 70 67 62 66 40 Z" fill={theme.trophy[0]} />
            <Rect x="31" y="37" width="38" height="5" rx="2" fill={theme.trophy[0]} />
            {[20, 35, 50, 65, 80].map(x => (
              <Circle key={x} cx={x} cy={18} r={4} fill="rgba(255,255,255,0.35)" />
            ))}
          </Svg>
        </View>
      );
    }
    case 'EntryStyle': {
      const style = entryStyle(code);
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <AppText style={{ fontSize: size * 0.5, lineHeight: size * 0.6 }}>{style?.emoji ?? '🚶'}</AppText>
        </View>
      );
    }
    case 'Card': {
      const [top, bottom] = cardColors(code);
      return (
        <LinearGradient colors={[top, bottom]} style={[styles.card, { width: size * 0.78, height: size, borderRadius: radius.sm }]}>
          <View style={styles.cardAvatar} />
          <View style={styles.cardLine} />
          <View style={[styles.cardLine, styles.cardLineShort]} />
        </LinearGradient>
      );
    }
    default: {
      const tint = dpTint(code);
      return (
        <View style={[styles.dp, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
          <Icon name="store" size={size * 0.45} color="rgba(255,255,255,0.85)" />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameDefault: {
    backgroundColor: palette.gold500,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: radius.md,
    borderTopLeftRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scene: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  card: {
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardAvatar: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: spacing.xs,
  },
  cardLine: {
    width: '70%',
    height: moderateScale(5),
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  cardLineShort: {
    width: '45%',
  },
  dp: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
});
