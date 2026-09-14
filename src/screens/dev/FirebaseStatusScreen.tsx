import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components';
import { getMissingConfig } from '../../config/env';
import { getFirebaseStatus } from '../../services/firebase';
import { styles } from './FirebaseStatusScreen.styles';

type Props = {
  initError: string | null;
};

/**
 * Temporary verification screen for feature 1 (Firebase configuration).
 * Replaced by the Splash → Login flow in feature 2.
 */
export function FirebaseStatusScreen({ initError }: Props) {
  const status = getFirebaseStatus();
  const missing = getMissingConfig();

  const rows: Array<[string, string, boolean]> = [
    ['Project ID', status.projectId ?? 'not found', !!status.projectId],
    [
      'Storage bucket',
      status.storageBucket ?? 'not found',
      !!status.storageBucket,
    ],
    ['Functions region', status.functionsRegion, true],
    ['Emulator', status.usingEmulator ? 'ON' : 'off', true],
    ['App Check', status.appCheckEnabled ? 'ON' : 'off', true],
    ['Init', initError ?? 'OK', !initError],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="display">VoxNest</AppText>
        <AppText variant="body" color="textSecondary" style={styles.subtitle}>
          Firebase configuration check
        </AppText>

        <View style={styles.card}>
          {rows.map(([label, value, ok]) => (
            <View key={label} style={styles.row}>
              <AppText variant="label" color="textMuted">
                {label}
              </AppText>
              <AppText variant="label" color={ok ? 'success' : 'danger'}>
                {value}
              </AppText>
            </View>
          ))}
        </View>

        {missing.length > 0 && (
          <View style={styles.warning}>
            <AppText variant="label" color="warning">
              Missing in .env: {missing.join(', ')}
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
