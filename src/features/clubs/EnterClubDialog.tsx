import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, DialogCard, Icon, TextField } from '../../components';
import { toApiError } from '../../api';
import { useClubLookup } from '../../hooks/useClubs';
import type { MainStackParamList } from '../../navigation/types';
import { colors, moderateScale, spacing } from '../../theme';

type Props = { visible: boolean; onClose: () => void };

/** "Enter A Club": paste an 8-digit id → GO opens the club. */
export function EnterClubDialog({ visible, onClose }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const lookup = useClubLookup();
  const [clubId, setClubId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setError(null);
    }
  }, [visible]);

  const paste = async () => {
    const text = await Clipboard.getString();
    setClubId(text.replace(/[^0-9]/g, '').slice(0, 8));
  };

  const go = () => {
    setError(null);
    lookup.mutate(clubId, {
      onSuccess: club => {
        onClose();
        navigation.navigate('ClubInfo', { publicId: club.id });
      },
      onError: e => {
        const apiError = toApiError(e);
        setError(apiError.status === 404 ? 'No club with that ID.' : apiError.message);
      },
    });
  };

  return (
    <DialogCard visible={visible} title="Enter A Club" onClose={onClose}>
      <View style={styles.inputRow}>
        <TextField
          value={clubId}
          onChangeText={value => setClubId(value.replace(/[^0-9]/g, '').slice(0, 8))}
          keyboardType="number-pad"
          placeholder="Enter or paste ClubID"
          containerStyle={styles.field}
          maxLength={8}
          onSubmitEditing={go}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Paste" onPress={paste} style={styles.paste}>
          <Icon name="copy" size={moderateScale(14)} color={colors.textPrimary} />
          <AppText variant="tiny">Paste</AppText>
        </Pressable>
      </View>
      {error ? (
        <AppText variant="caption" color="danger" align="center" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button label="GO" disabled={clubId.length !== 8} loading={lookup.isPending} onPress={go} style={styles.go} />
      </View>
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  field: {
    flex: 1,
  },
  paste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: moderateScale(46),
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    marginBottom: spacing.md,
  },
  actions: {
    alignItems: 'center',
  },
  go: {
    minWidth: 140,
  },
});
