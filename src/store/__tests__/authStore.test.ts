import * as Keychain from 'react-native-keychain';

import { authApi } from '../../api/auth';
import type { AuthResponse } from '../../api/types';
import { ApiError } from '../../api/errors';
import { useAuthStore } from '../authStore';

jest.mock('../../api/auth', () => ({
  authApi: {
    loginWithGoogle: jest.fn(),
    loginDev: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(async () => undefined),
  },
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

function authResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    accessToken: 'access-1',
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    refreshToken: 'refresh-1',
    refreshTokenExpiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    user: {
      id: 'MOBI4875',
      displayName: 'Mobile Developer',
      email: 'dev@mehfil.local',
      gender: 'Unspecified',
      genderLocked: false,
      level: 1,
      heartsBalance: 0,
      heartsReceived: 0,
      heartsGifted: 0,
      royaltyPoints: 0,
      royalLevel: 'None',
      highestRoyalLevel: 'None',
      primeLevel: 'None',
      royalStreakMonths: 0,
      role: 'User',
      createdAt: new Date().toISOString(),
    },
    isNewUser: true,
    ...overrides,
  };
}

describe('authStore', () => {
  beforeEach(() => {
    (Keychain as unknown as { __reset: () => void }).__reset();
    jest.clearAllMocks();
    useAuthStore.setState({
      status: 'restoring',
      user: null,
      accessToken: null,
      refreshToken: null,
      isBusy: false,
      error: null,
    });
  });

  it('restore() signs out when nothing is stored', async () => {
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signInDev() stores the session in the keychain and signs in', async () => {
    mockedAuthApi.loginDev.mockResolvedValueOnce(authResponse());

    await useAuthStore.getState().signInDev('dev@mehfil.local', 'Mobile Developer');

    const state = useAuthStore.getState();
    expect(state.status).toBe('signedIn');
    expect(state.user?.id).toBe('MOBI4875');
    expect(state.accessToken).toBe('access-1');
    expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1);

    // A fresh restore() picks the session back up.
    useAuthStore.setState({ status: 'restoring', user: null, accessToken: null, refreshToken: null });
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-1');
  });

  it('restore() drops a session whose refresh token has expired', async () => {
    mockedAuthApi.loginDev.mockResolvedValueOnce(
      authResponse({ refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString() }),
    );
    await useAuthStore.getState().signInDev('dev@mehfil.local');

    useAuthStore.setState({ status: 'restoring' });
    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(Keychain.resetGenericPassword).toHaveBeenCalled();
  });

  it('signIn failures surface the API message and stay signed out', async () => {
    mockedAuthApi.loginWithGoogle.mockRejectedValueOnce(
      new ApiError({ code: 'auth.invalid_google_token', message: 'Bad token.', status: 401 }),
    );

    await useAuthStore.getState().signInWithGoogle();

    expect(useAuthStore.getState().status).toBe('restoring'); // unchanged
    expect(useAuthStore.getState().error).toBe('Bad token.');
    expect(useAuthStore.getState().isBusy).toBe(false);
  });

  it('signOut() revokes the refresh token and clears the keychain', async () => {
    mockedAuthApi.loginDev.mockResolvedValueOnce(authResponse());
    await useAuthStore.getState().signInDev('dev@mehfil.local');

    await useAuthStore.getState().signOut();

    expect(mockedAuthApi.logout).toHaveBeenCalledWith('refresh-1');
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().user).toBeNull();
    expect(await Keychain.getGenericPassword({ service: 'x' })).toBeNull();
  });

  it('refreshSession() replaces tokens', async () => {
    mockedAuthApi.loginDev.mockResolvedValueOnce(authResponse());
    await useAuthStore.getState().signInDev('dev@mehfil.local');
    mockedAuthApi.refresh.mockResolvedValueOnce(authResponse({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

    await useAuthStore.getState().refreshSession();

    expect(mockedAuthApi.refresh).toHaveBeenCalledWith('refresh-1');
    expect(useAuthStore.getState().accessToken).toBe('access-2');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-2');
  });
});
