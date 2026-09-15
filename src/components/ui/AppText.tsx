import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

import { ColorToken, colors, typography, TypographyVariant } from '../../theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  /** Adds the dark drop shadow used on gold titles in the design. */
  shadow?: boolean;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
};

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  shadow = false,
  align,
  uppercase = false,
  style,
  children,
  ...rest
}: Props) {
  return (
    <Text
      style={[
        typography[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        shadow ? styles.shadow : null,
        uppercase ? styles.uppercase : null,
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  shadow: {
    textShadowColor: colors.textShadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
