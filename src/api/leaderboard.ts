import { apiClient } from './client';
import type { LeaderboardBoard, LeaderboardDto, LeaderboardPeriod, LeaderboardRewardsDto } from './types';

export const leaderboardApi = {
  async get(board: LeaderboardBoard, period: LeaderboardPeriod): Promise<LeaderboardDto> {
    const { data } = await apiClient.get<LeaderboardDto>(`/leaderboard/${board}`, { params: { period } });
    return data;
  },

  async rewards(): Promise<LeaderboardRewardsDto> {
    const { data } = await apiClient.get<LeaderboardRewardsDto>('/leaderboard/rewards');
    return data;
  },
};
