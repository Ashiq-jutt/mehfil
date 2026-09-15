import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, DialogCard, TextField } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme';

type Props = { visible: boolean; onClose: () => void };

/**
 * Debug-only email login that talks to the backend's /auth/dev endpoint.
 * Lets the whole app be exercised before Google OAuth clients exist.
 */
export function DevLoginDialog({ visible, onClose }: Props) {
  const signInDev = useAuthStore(s => s.signInDev);
  const isBusy = useAuthStore(s => s.isBusy);
  const [email, setEmail] = useState('dev@mehfil.local');
  const [displayName, setDisplayName] = useState('Mobile Developer');

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!valid) {
      return;
    }
    await signInDev(email.trim(), displayName.trim() || undefined);
    if (useAuthStore.getState().status === 'signedIn') {
      onClose();
    }
  };

  return (
    <DialogCard visible={visible} title="Developer login" subtitle="Debug builds only" onClose={onClose}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
        containerStyle={styles.field}
      />
      <TextField
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Mobile Developer"
        containerStyle={styles.field}
      />
      <AppText variant="caption" color="textMuted" style={styles.note}>
        Requires DevLogin:Enabled = true in the backend (Development only).
      </AppText>
      <Button label="Sign in" onPress={submit} loading={isBusy} disabled={!valid} />
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  note: {
    marginBottom: spacing.lg,
  },
});
