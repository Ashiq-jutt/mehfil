import { apiClient } from './client';
import type { UserDto } from './types';

export const usersApi = {
  async getMe(): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>('/users/me');
    return data;
  },
};
