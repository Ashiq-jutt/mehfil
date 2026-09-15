import { Platform } from 'react-native';
import Config from 'react-native-config';

const flag = (value: string | undefined) => value === 'true';

/**
 * Android emulators reach the host machine via 10.0.2.2; iOS simulators via localhost.
 * Physical devices need the machine's LAN IP in API_BASE_URL.
 */
const defaultApiBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:5080' : 'http://localhost:5080';

/**
 * Typed, validated view of public client configuration (see .env.example).
 * Everything here ships inside the binary — never put secrets in .env.
 */
export const env = {
  apiBaseUrl: (Config.API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, ''),
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID ?? '',
  agoraAppId: Config.AGORA_APP_ID ?? '',
  /** Shows the "Developer login" option on the login screen (debug builds only). */
  devLoginEnabled: __DEV__ && flag(Config.DEV_LOGIN_ENABLED),
  /** Registers for FCM push. Requires the Firebase config files in the native projects. */
  pushEnabled: flag(Config.PUSH_ENABLED),
} as const;

export type MissingConfigKey = 'GOOGLE_WEB_CLIENT_ID';

export function getMissingConfig(): MissingConfigKey[] {
  const missing: MissingConfigKey[] = [];
  if (!env.googleWebClientId) {
    missing.push('GOOGLE_WEB_CLIENT_ID');
  }
  return missing;
}
