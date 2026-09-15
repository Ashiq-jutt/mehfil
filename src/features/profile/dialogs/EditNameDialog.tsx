import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, DialogCard, TextField } from '../../../components';
import { useUpdateProfile } from '../../../hooks/useProfile';
import { spacing } from '../../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  signature?: string | null;
};

export function EditNameDialog({ visible, onClose, displayName, signature }: Props) {
  const [name, setName] = useState(displayName);
  const [sig, setSig] = useState(signature ?? '');
  const mutation = useUpdateProfile();

  useEffect(() => {
    if (visible) {
      setName(displayName);
      setSig(signature ?? '');
    }
  }, [visible, displayName, signature]);

  const trimmed = name.trim();
  const nameError = trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 32) ? 'Use 2–32 characters.' : undefined;
  const canSave = trimmed.length >= 2 && trimmed.length <= 32 && sig.length <= 120;

  return (
    <DialogCard visible={visible} title="Edit profile" onClose={onClose}>
      <TextField
        label="Display name"
        value={name}
        onChangeText={setName}
        maxLength={32}
        error={nameError}
        containerStyle={styles.field}
      />
      <TextField
        label="Signature"
        value={sig}
        onChangeText={setSig}
        maxLength={120}
        placeholder="Say something about yourself"
        multiline
        containerStyle={styles.field}
        style={styles.signature}
      />
      <Button
        label="Save"
        disabled={!canSave}
        loading={mutation.isPending}
        onPress={() => mutation.mutate({ displayName: trimmed, signature: sig.trim() }, { onSuccess: onClose })}
      />
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  signature: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
});
