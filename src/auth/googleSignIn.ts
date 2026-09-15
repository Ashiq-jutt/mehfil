import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { env } from '../config/env';

let configured = false;

function ensureConfigured() {
  if (configured) {
    return;
  }
  GoogleSignin.configure({
    webClientId: env.googleWebClientId || undefined,
    iosClientId: env.googleIosClientId || undefined,
    offlineAccess: false,
    scopes: ['email', 'profile'],
  });
  configured = true;
}

export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Sign-in was cancelled.');
    this.name = 'GoogleSignInCancelled';
  }
}

/** Runs the native Google sign-in and returns the ID token to exchange with the backend. */
export async function getGoogleIdToken(): Promise<string> {
  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      // type === 'cancelled'
      throw new GoogleSignInCancelled();
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Check GOOGLE_WEB_CLIENT_ID.');
    }
    return idToken;
  } catch (error) {
    if (error instanceof GoogleSignInCancelled) {
      throw error;
    }
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new GoogleSignInCancelled();
        case statusCodes.IN_PROGRESS:
          throw new Error('Sign-in is already in progress.');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services are not available on this device.');
        default:
          throw new Error(error.message || 'Google sign-in failed.');
      }
    }
    throw error;
  }
}

export async function signOutOfGoogle(): Promise<void> {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google (dev login) or Play Services missing — nothing to do.
  }
}
