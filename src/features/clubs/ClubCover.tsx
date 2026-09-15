import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText } from '../../components';
import { palette } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';

const GRADIENTS: string[][] = [
  [palette.violet500, palette.plum600],
  [palette.sky800, palette.violet700],
  [palette.plum400, palette.violet900],
  [palette.gold700, palette.plum700],
  [palette.green700, palette.sky900],
];

type Props = {
  uri?: string | null;
  name: string;
  style?: StyleProp<ViewStyle>;
  /** Border radius applied to both the image and the fallback. */
  radius?: number;
};

/** Club cover image with a deterministic gradient + initial fallback when there is no image (or it fails). */
export function ClubCover({ uri, name, style, radius = 0 }: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveAssetUrl(uri);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const gradient = GRADIENTS[hash(name) % GRADIENTS.length];

  if (resolved && !failed) {
    return (
      <Image
        source={{ uri: resolved }}
        onError={() => setFailed(true)}
        resizeMode="cover"
        style={[styles.image, { borderRadius: radius }, style as StyleProp<ImageStyle>]}
      />
    );
  }

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.fallback, { borderRadius: radius }, style]}>
      <View style={styles.initialBubble}>
        <AppText variant="display" color="textGold" shadow>
          {initial}
        </AppText>
      </View>
    </LinearGradient>
  );
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h);
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialBubble: {
    width: '42%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
