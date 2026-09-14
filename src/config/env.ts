import { Platform } from 'react-native';
import Config from 'react-native-config';

const flag = (value: string | undefined) => value === 'true';

/**
 * Typed, validated view of public client configuration.
 * Secrets never live here — see .env.example.
 */
export const env = {
  functionsRegion: Config.FIREBASE_FUNCTIONS_REGION || 'us-central1',
  // Emulator is only ever honoured in debug builds.
  useEmulator: __DEV__ && flag(Config.USE_FIREBASE_EMULATOR),
  emulatorHost:
    Platform.OS === 'android'
      ? Config.FIREBASE_EMULATOR_HOST_ANDROID || '10.0.2.2'
      : Config.FIREBASE_EMULATOR_HOST_IOS || 'localhost',
  appCheckEnabled: flag(Config.APP_CHECK_ENABLED),
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID ?? '',
  agoraAppId: Config.AGORA_APP_ID ?? '',
} as const;

export type MissingConfigKey = 'GOOGLE_WEB_CLIENT_ID' | 'AGORA_APP_ID';

export function getMissingConfig(): MissingConfigKey[] {
  const missing: MissingConfigKey[] = [];
  if (!env.googleWebClientId) {
    missing.push('GOOGLE_WEB_CLIENT_ID');
  }
  if (!env.agoraAppId) {
    missing.push('AGORA_APP_ID');
  }
  return missing;
}
