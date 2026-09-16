import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  AppText,
  Button,
  ErrorBanner,
  Icon,
  LanternsHeader,
  Panel,
  Screen,
} from '../../components';
import { env, getMissingConfig } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';
import { DevLoginDialog } from './DevLoginDialog';
import { styles } from './LoginScreen.styles';

export function LoginScreen() {
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle);
  const isBusy = useAuthStore(s => s.isBusy);
  const error = useAuthStore(s => s.error);
  const clearError = useAuthStore(s => s.clearError);
  const [devVisible, setDevVisible] = useState(false);

  const missingConfig = getMissingConfig();
  const googleReady = missingConfig.length === 0;

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <LanternsHeader />

      <View style={styles.hero}>
        <AppText variant="hero" color="textGold" shadow style={styles.brand}>
          Mehfil
        </AppText>
        <AppText variant="subheading" color="textSecondary" align="center">
          Voice clubs for your people
        </AppText>
      </View>

      <View style={styles.bottom}>
        <Panel variant="modal" style={styles.card}>
          <AppText variant="title" align="center" shadow>
            Welcome
          </AppText>
          <AppText variant="body" color="textSecondary" align="center" style={styles.subtitle}>
            Sign in to join clubs, chat live and send hearts.
          </AppText>

          {error ? (
            <View style={styles.error}>
              <ErrorBanner message={error} onDismiss={clearError} />
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isBusy || !googleReady}
            onPress={signInWithGoogle}
            style={({ pressed }) => [
              styles.googleButton,
              { opacity: isBusy || !googleReady ? 0.55 : pressed ? 0.85 : 1 },
            ]}>
            <Icon name="google" size={22} />
            <AppText variant="heading" style={styles.googleLabel}>
              Continue with Google
            </AppText>
          </Pressable>

          {!googleReady ? (
            <AppText variant="caption" color="textMuted" align="center" style={styles.hint}>
              Google Sign-In is not configured yet (missing {missingConfig.join(', ')} in .env).
            </AppText>
          ) : null}

          {env.devLoginEnabled ? (
            <Button
              label="Developer login"
              variant="ghost"
              icon="user"
              onPress={() => setDevVisible(true)}
              disabled={isBusy}
              style={styles.devButton}
            />
          ) : null}
        </Panel>

        <AppText variant="tiny" color="textMuted" align="center" style={styles.terms}>
          By continuing you agree to the Mehfil community rules.
        </AppText>
      </View>

      <DevLoginDialog visible={devVisible} onClose={() => setDevVisible(false)} />
    </Screen>
  );
}

export const loginColors = colors;
