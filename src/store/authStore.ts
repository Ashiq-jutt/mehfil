import { Platform } from 'react-native';
import { create } from 'zustand';

import { attachAuthBridge, authApi, toApiError } from '../api';
import type { AuthResponse, UserDto } from '../api/types';
import { getGoogleIdToken, signOutOfGoogle } from '../auth/googleSignIn';
import { sessionStorage, StoredSession } from '../auth/sessionStorage';
import { unregisterPush } from '../push/pushService';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isBusy: boolean;
  error: string | null;

  restore: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDev: (email: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse>;
  setUser: (user: UserDto) => void;
  clearError: () => void;
}

const deviceName = `${Platform.OS} ${Platform.Version}`;

function toStored(auth: AuthResponse): StoredSession {
  return {
    accessToken: auth.accessToken,
    accessTokenExpiresAt: auth.accessTokenExpiresAt,
    refreshToken: auth.refreshToken,
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
    user: auth.user,
  };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const applySession = async (auth: AuthResponse) => {
    await sessionStorage.save(toStored(auth));
    set({
      status: 'signedIn',
      user: auth.user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      error: null,
    });
  };

  const dropSession = async () => {
    await sessionStorage.clear();
    set({ status: 'signedOut', user: null, accessToken: null, refreshToken: null });
  };

  const runSignIn = async (login: () => Promise<AuthResponse>) => {
    if (get().isBusy) {
      return;
    }
    set({ isBusy: true, error: null });
    try {
      const auth = await login();
      await applySession(auth);
    } catch (error) {
      if (error instanceof Error && error.name === 'GoogleSignInCancelled') {
        return; // user backed out; not an error
      }
      set({ error: toApiError(error).message });
    } finally {
      set({ isBusy: false });
    }
  };

  return {
    status: 'restoring',
    user: null,
    accessToken: null,
    refreshToken: null,
    isBusy: false,
    error: null,

    async restore() {
      const stored = await sessionStorage.load();
      if (!stored) {
        set({ status: 'signedOut' });
        return;
      }

      const refreshExpired = new Date(stored.refreshTokenExpiresAt).getTime() <= Date.now();
      if (refreshExpired) {
        await dropSession();
        return;
      }

      set({
        status: 'signedIn',
        user: stored.user,
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
      });
    },

    signInWithGoogle: () =>
      runSignIn(async () => {
        const idToken = await getGoogleIdToken();
        return authApi.loginWithGoogle({ idToken, deviceName });
      }),

    signInDev: (email, displayName) =>
      runSignIn(() => authApi.loginDev({ email, displayName, deviceName })),

    async signOut() {
      const { refreshToken } = get();
      set({ isBusy: true });
      try {
        await unregisterPush().catch(() => undefined);
        if (refreshToken) {
          await authApi.logout(refreshToken).catch(() => undefined);
        }
        await signOutOfGoogle();
      } finally {
        await dropSession();
        set({ isBusy: false });
      }
    },

    async refreshSession() {
      const { refreshToken } = get();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      const auth = await authApi.refresh(refreshToken);
      await applySession(auth);
      return auth;
    },

    setUser(user) {
      set({ user });
      const { accessToken, refreshToken } = get();
      const stored = accessToken && refreshToken ? sessionStorage.load() : null;
      if (stored) {
        stored.then(existing => existing && sessionStorage.save({ ...existing, user }));
      }
    },

    clearError() {
      set({ error: null });
    },
  };
});

// Wire the API client to the store so 401s refresh transparently and dead sessions sign out.
attachAuthBridge({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshSession: () => useAuthStore.getState().refreshSession(),
  onSessionExpired: () => {
    sessionStorage.clear().catch(() => undefined);
    useAuthStore.setState({ status: 'signedOut', user: null, accessToken: null, refreshToken: null });
  },
});
