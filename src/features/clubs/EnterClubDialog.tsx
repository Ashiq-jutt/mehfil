import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DialogCard, TextField } from '../../components';
import { spacing } from '../../theme';

type Props = { visible: boolean; onClose: () => void };

/** "Enter A Club" search-by-ID dialog. Lookup is wired to the API in phase 4. */
export function EnterClubDialog({ visible, onClose }: Props) {
  const [clubId, setClubId] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const close = () => {
    setNote(null);
    onClose();
  };

  return (
    <DialogCard visible={visible} title="Enter A Club" onClose={close}>
      <TextField
        value={clubId}
        onChangeText={value => setClubId(value.replace(/[^0-9]/g, '').slice(0, 8))}
        keyboardType="number-pad"
        placeholder="Enter or paste Club ID"
        containerStyle={styles.field}
        maxLength={8}
      />
      {note ? (
        <AppText variant="caption" color="textGold" align="center" style={styles.note}>
          {note}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button
          label="GO"
          disabled={clubId.length !== 8}
          onPress={() => setNote('Club lookup connects to the API in phase 4.')}
          style={styles.go}
        />
      </View>
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  note: {
    marginBottom: spacing.md,
  },
  actions: {
    alignItems: 'center',
  },
  go: {
    minWidth: 140,
  },
});
