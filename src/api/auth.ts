import { apiClient } from './client';
import type { AuthResponse, DevLoginRequest, GoogleLoginRequest } from './types';

export const authApi = {
  async loginWithGoogle(request: GoogleLoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/google', request);
    return data;
  },

  async loginDev(request: DevLoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/dev', request);
    return data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
