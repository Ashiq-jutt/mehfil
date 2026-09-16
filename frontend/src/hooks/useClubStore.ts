import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { storeApi, toApiError } from '../api';
import type { BuyResultDto, EquipResultDto } from '../api/types';
import { kindLabel } from '../features/store/storeCopy';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useSyncBalance, walletKey } from './useEconomy';

export const storeKey = ['store'] as const;

export function useStoreItems() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: storeKey,
    queryFn: storeApi.get,
    enabled: status === 'signedIn',
    staleTime: 30_000,
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  return useMutation({
    mutationFn: (code: string) => storeApi.equip(code),
    onSuccess: (result: EquipResultDto) => {
      queryClient.invalidateQueries({ queryKey: storeKey });
      show(result.equippedCode ? `${kindLabel(result.kind)} equipped.` : `${kindLabel(result.kind)} reset to default.`, 'success');
    },
    onError: error => {
      const apiError = toApiError(error);
      show(apiError.message, apiError.code === 'store.locked' ? 'info' : 'error');
    },
  });
}

export function useBuyItem() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  const sync = useSyncBalance();
  return useMutation({
    mutationFn: (code: string) => storeApi.buy(code),
    onSuccess: (result: BuyResultDto) => {
      sync(result.balance);
      queryClient.invalidateQueries({ queryKey: storeKey });
      queryClient.invalidateQueries({ queryKey: walletKey });
      show('Item added to your collection.', 'success');
    },
    onError: error => {
      const apiError = toApiError(error);
      show(apiError.message, apiError.code === 'store.insufficient_hearts' ? 'info' : 'error');
    },
  });
}
