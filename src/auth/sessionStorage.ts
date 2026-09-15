import * as Keychain from 'react-native-keychain';

import type { UserDto } from '../api/types';

const SERVICE = 'com.jalopy.mehfil.session';
const USERNAME = 'session';

/** What survives an app restart. Tokens live in the OS keystore/keychain, never AsyncStorage. */
export interface StoredSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserDto;
}

export const sessionStorage = {
  async load(): Promise<StoredSession | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: SERVICE });
      if (!credentials) {
        return null;
      }
      const parsed = JSON.parse(credentials.password) as Partial<StoredSession>;
      if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) {
        return null;
      }
      return parsed as StoredSession;
    } catch {
      return null;
    }
  },

  async save(session: StoredSession): Promise<void> {
    await Keychain.setGenericPassword(USERNAME, JSON.stringify(session), {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  },

  async clear(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
    } catch {
      // Nothing to clear.
    }
  },
};
