import { StyleSheet } from 'react-native';

import { spacing } from '../../theme';

export const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    letterSpacing: 1.5,
  },
  tagline: {
    marginTop: spacing.xs,
  },
  spinner: {
    marginTop: spacing.xxl,
  },
});
