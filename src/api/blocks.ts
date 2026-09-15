import { apiClient } from './client';
import type { BlockedUserDto } from './types';

export const blocksApi = {
  async list(): Promise<BlockedUserDto[]> {
    const { data } = await apiClient.get<BlockedUserDto[]>('/blocks');
    return data;
  },

  async block(userId: string): Promise<BlockedUserDto[]> {
    const { data } = await apiClient.put<BlockedUserDto[]>(`/blocks/${encodeURIComponent(userId)}`);
    return data;
  },

  async unblock(userId: string): Promise<BlockedUserDto[]> {
    const { data } = await apiClient.delete<BlockedUserDto[]>(`/blocks/${encodeURIComponent(userId)}`);
    return data;
  },
};
