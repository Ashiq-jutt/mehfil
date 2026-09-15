import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { toApiError } from './errors';
import type { AuthResponse } from './types';

/**
 * Single axios instance for the backend. Auth wiring is injected by the auth store
 * (getAccessToken / refreshSession / onSessionExpired) so this module stays free of UI state.
 */
export const apiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

interface AuthBridge {
  getAccessToken: () => string | null;
  /** Must resolve with the new session or throw. Called at most once concurrently. */
  refreshSession: () => Promise<AuthResponse>;
  onSessionExpired: () => void;
}

let bridge: AuthBridge | null = null;
let refreshInFlight: Promise<AuthResponse> | null = null;

export function attachAuthBridge(next: AuthBridge) {
  bridge = next;
}

const AUTH_PATHS = ['/auth/google', '/auth/refresh', '/auth/logout', '/auth/dev'];

function isAuthEndpoint(url: string | undefined) {
  return !!url && AUTH_PATHS.some(path => url.includes(path));
}

apiClient.interceptors.request.use(config => {
  const token = bridge?.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && config && !config._retried && !isAuthEndpoint(config.url) && bridge) {
      config._retried = true;
      try {
        refreshInFlight ??= bridge.refreshSession().finally(() => {
          refreshInFlight = null;
        });
        const session = await refreshInFlight;
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        return apiClient.request(config);
      } catch {
        bridge.onSessionExpired();
      }
    }

    throw toApiError(error);
  },
);
