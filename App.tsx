import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FirebaseStatusScreen } from './src/screens/dev/FirebaseStatusScreen';
import { initFirebase } from './src/services/firebase';
import { colors } from './src/styles';

function App() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initFirebase()
      .catch((e: unknown) =>
        setInitError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => setReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {ready ? (
        <FirebaseStatusScreen initError={initError} />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default App;
