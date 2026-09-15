import { apiClient } from './client';
import type { RoyaltyDto } from './types';

export const royaltyApi = {
  async get(): Promise<RoyaltyDto> {
    const { data } = await apiClient.get<RoyaltyDto>('/royalty');
    return data;
  },
};
