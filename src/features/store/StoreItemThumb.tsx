import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { palette, radius } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import type { StoreItemKind } from '../../api/types';

export type StoreItemLike = { kind: StoreItemKind; name: string; assetUrl: string; previewUrl?: string | null };

type Props = { item: StoreItemLike; size?: number };

/** Store item preview: the item's image when it loads, otherwise an original glyph for its kind. */
export function StoreItemThumb({ item, size = 56 }: Props) {
  const [failed, setFailed] = useState(false);
  const uri = resolveAssetUrl(item.previewUrl ?? item.assetUrl);

  if (uri && !failed) {
    return <Image source={{ uri }} onError={() => setFailed(true)} resizeMode="contain" style={{ width: size, height: size, borderRadius: radius.sm }} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <KindGlyph kind={item.kind} size={size * 0.72} tint={tintFor(item.name)} />
    </View>
  );
}

const TINTS = [palette.gold400, palette.pink500, palette.blue500, palette.green400, palette.violet300, palette.red400];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1_000_003;
  }
  return TINTS[hash % TINTS.length];
}

function KindGlyph({ kind, size, tint }: { kind: StoreItemKind; size: number; tint: string }) {
  switch (kind) {
    case 'Frame':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx="24" cy="24" r="19" fill="none" stroke={tint} strokeWidth={5} />
          <Circle cx="24" cy="24" r="13" fill="rgba(255,255,255,0.12)" />
          <Circle cx="10" cy="14" r="3.5" fill={palette.gold300} />
          <Circle cx="38" cy="34" r="3.5" fill={palette.gold300} />
        </Svg>
      );
    case 'ChatBubble':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M8 10h32a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H20l-8 7v-7H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="rgba(255,255,255,0.12)" stroke={tint} strokeWidth={3} />
          <Path d="M13 19h22M13 25h14" stroke={tint} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case 'EntryStyle':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M24 4l5.5 12.5L43 18l-10 9 3 13.5L24 33l-12 7.5L15 27 5 18l13.5-1.5z" fill={tint} stroke={palette.gold300} strokeWidth={2} />
        </Svg>
      );
    case 'Background':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect x="4" y="8" width="40" height="32" rx="5" fill={tint} opacity={0.35} stroke={tint} strokeWidth={2.5} />
          <Circle cx="34" cy="17" r="4" fill={palette.gold300} />
          <Path d="M6 38l12-14 8 9 6-6 10 11z" fill={tint} />
        </Svg>
      );
    case 'Card':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect x="9" y="5" width="30" height="38" rx="4" fill="rgba(255,255,255,0.12)" stroke={tint} strokeWidth={3} />
          <Circle cx="24" cy="18" r="6" fill={tint} />
          <Path d="M15 33h18M17 38h14" stroke={tint} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx="24" cy="24" r="20" fill={tint} opacity={0.35} stroke={tint} strokeWidth={3} />
          <Circle cx="24" cy="19" r="7" fill={palette.white} />
          <Path d="M11 40c2-8 7-12 13-12s11 4 13 12z" fill={palette.white} />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
