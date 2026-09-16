import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { blocksApi, toApiError } from '../api';
import type { BlockedUserDto } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export const blocksKey = ['blocks'] as const;

export function useBlocks() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: blocksKey,
    queryFn: blocksApi.list,
    enabled: status === 'signedIn',
    staleTime: 60_000,
  });
}

/** Public ids of everyone the caller has blocked (used to hide their chat messages). */
export function useBlockedIds(): Set<string> {
  const { data } = useBlocks();
  return useMemo(() => new Set((data ?? []).map(b => b.id)), [data]);
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  return useMutation({
    mutationFn: (userId: string) => blocksApi.block(userId),
    onSuccess: (list: BlockedUserDto[]) => {
      queryClient.setQueryData(blocksKey, list);
      show('User blocked. Their messages and gifts are hidden from you.', 'success');
    },
    onError: error => show(toApiError(error).message, 'error'),
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  return useMutation({
    mutationFn: (userId: string) => blocksApi.unblock(userId),
    onSuccess: (list: BlockedUserDto[]) => {
      queryClient.setQueryData(blocksKey, list);
      show('User unblocked.', 'success');
    },
    onError: error => show(toApiError(error).message, 'error'),
  });
}
