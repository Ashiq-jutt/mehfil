import React from 'react';
import { Text, TextProps } from 'react-native';

import { ColorToken, colors, typography } from '../../styles';

type Props = TextProps & {
  variant?: keyof typeof typography;
  color?: ColorToken;
};

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  style,
  ...rest
}: Props) {
  return (
    <Text
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}
