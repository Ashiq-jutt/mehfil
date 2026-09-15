import { useQuery } from '@tanstack/react-query';

import { leaderboardApi } from '../api';
import type { LeaderboardBoard, LeaderboardPeriod } from '../api/types';
import { useAuthStore } from '../store/authStore';

export const leaderboardRootKey = ['leaderboard'] as const;
export const leaderboardKey = (board: LeaderboardBoard, period: LeaderboardPeriod) => ['leaderboard', 'board', board, period] as const;
export const leaderboardRewardsKey = ['leaderboard', 'rewards'] as const;

/** Previous + current rankings for a board. Live rankings are re-fetched every minute while the screen is open. */
export function useLeaderboard(board: LeaderboardBoard, period: LeaderboardPeriod) {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: leaderboardKey(board, period),
    queryFn: () => leaderboardApi.get(board, period),
    enabled: status === 'signedIn',
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useLeaderboardRewards(enabled = true) {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: leaderboardRewardsKey,
    queryFn: leaderboardApi.rewards,
    enabled: enabled && status === 'signedIn',
    staleTime: 60 * 60_000,
  });
}
