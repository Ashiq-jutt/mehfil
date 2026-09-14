import { getApp } from '@react-native-firebase/app';
import {
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
} from '@react-native-firebase/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
} from '@react-native-firebase/functions';
import {
  connectStorageEmulator,
  getStorage,
} from '@react-native-firebase/storage';

import { env } from '../../config/env';
import { EMULATOR_PORTS } from '../../constants/emulatorPorts';

/**
 * Single place where Firebase SDK instances are created.
 * Screens never import @react-native-firebase/* directly — they go through
 * feature services (authService, roomService, …) that use these instances.
 */
export const firebaseApp = getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, env.functionsRegion);
export const storage = getStorage(firebaseApp);

let initialized = false;

export async function initFirebase(): Promise<void> {
  if (initialized) {
    return;
  }
  initialized = true;

  if (env.useEmulator) {
    const host = env.emulatorHost;
    connectAuthEmulator(auth, `http://${host}:${EMULATOR_PORTS.auth}`);
    connectFirestoreEmulator(db, host, EMULATOR_PORTS.firestore);
    connectFunctionsEmulator(functions, host, EMULATOR_PORTS.functions);
    connectStorageEmulator(storage, host, EMULATOR_PORTS.storage);
  }

  if (env.appCheckEnabled) {
    const provider = new ReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
      },
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
      },
    });
    await initializeAppCheck(firebaseApp, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export function getFirebaseStatus() {
  return {
    projectId: firebaseApp.options.projectId ?? null,
    storageBucket: firebaseApp.options.storageBucket ?? null,
    functionsRegion: env.functionsRegion,
    usingEmulator: env.useEmulator,
    appCheckEnabled: env.appCheckEnabled,
  };
}
