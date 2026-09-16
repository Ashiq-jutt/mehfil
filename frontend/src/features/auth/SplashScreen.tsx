import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText, LanternsHeader, Screen } from '../../components';
import { colors } from '../../theme';
import { styles } from './SplashScreen.styles';

/** Shown while the stored session is restored from the keychain. */
export function SplashScreen() {
  return (
    <Screen>
      <LanternsHeader />
      <View style={styles.center}>
        <AppText variant="hero" color="textGold" shadow style={styles.brand}>
          Mehfil
        </AppText>
        <AppText variant="subheading" color="textSecondary" style={styles.tagline}>
          Voice clubs for your people
        </AppText>
        <ActivityIndicator color={colors.accent} size="large" style={styles.spinner} />
      </View>
    </Screen>
  );
}
