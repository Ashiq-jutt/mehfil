import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DialogCard, TextField } from '../../components';
import { spacing } from '../../theme';

type Props = { visible: boolean; busy: boolean; onClose: () => void; onConfirm: () => void };

export const DELETE_CONFIRM_WORD = 'DELETE';

/** Two-step confirmation: the user must type DELETE before the account is removed. */
export function DeleteAccountDialog({ visible, busy, onClose, onConfirm }: Props) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (visible) {
      setTyped('');
    }
  }, [visible]);

  return (
    <DialogCard visible={visible} title="Delete account?" onClose={onClose} dismissOnBackdrop={!busy}>
      <AppText variant="body" color="textSecondary" align="center">
        This removes your profile, signs you out everywhere and deactivates any club you own. Hearts and purchases cannot be
        restored.
      </AppText>
      <TextField label={`Type ${DELETE_CONFIRM_WORD} to confirm`} value={typed} onChangeText={setTyped} autoCapitalize="characters" containerStyle={styles.field} />
      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
        <Button label="Delete" variant="danger" disabled={typed.trim().toUpperCase() !== DELETE_CONFIRM_WORD} loading={busy} onPress={onConfirm} style={styles.action} />
      </View>
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
});
