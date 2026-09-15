import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { giftsApi, roomApi, toApiError, walletApi } from '../api';
import type { HeartsPackageDto, SendGiftRequest, SendGiftResultDto, WalletDto } from '../api/types';
import { getPurchaseStore } from '../iap/purchaseStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { meQueryKey } from './useMe';
import { profileQueryKey } from './useProfile';

export const walletKey = ['wallet'] as const;
export const shopKey = ['wallet', 'shop'] as const;

/** Keeps the cached session user's balance in sync with wallet responses. */
function useSyncBalance() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);
  return (balance: number) => {
    const user = useAuthStore.getState().user;
    if (user && user.heartsBalance !== balance) {
      setUser({ ...user, heartsBalance: balance });
    }
    queryClient.invalidateQueries({ queryKey: meQueryKey });
    queryClient.invalidateQueries({ queryKey: profileQueryKey });
  };
}

export function useWallet(page = 1) {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: [...walletKey, page],
    queryFn: () => walletApi.get(page),
    enabled: status === 'signedIn',
    staleTime: 10_000,
  });
}

export function useShop() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: shopKey,
    queryFn: walletApi.shop,
    enabled: status === 'signedIn',
    staleTime: 30_000,
  });
}

export function useGiftCatalog(enabled = true) {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: ['gifts'],
    queryFn: giftsApi.catalog,
    enabled: enabled && status === 'signedIn',
    staleTime: 60 * 60_000,
  });
}

/** Runs the store purchase then verifies it with the backend. */
export function usePurchase(sandboxMode: boolean) {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  const sync = useSyncBalance();

  return useMutation({
    mutationFn: async (pkg: HeartsPackageDto) => {
      const store = getPurchaseStore(sandboxMode);
      if (!store) {
        throw new Error('Store purchases are not available in this build yet.');
      }
      const purchase = await store.purchase(pkg);
      if (!purchase) {
        return null; // cancelled
      }
      return walletApi.verifyPurchase(purchase);
    },
    onSuccess: result => {
      if (!result) {
        return;
      }
      sync(result.balance);
      queryClient.invalidateQueries({ queryKey: walletKey });
      queryClient.invalidateQueries({ queryKey: ['royalty'] });
      show(result.alreadyProcessed ? 'Purchase already applied.' : `+${result.heartsGranted} hearts added!`, 'success');
    },
    onError: error => show(toApiError(error).message, 'error'),
  });
}

export function useDevGrant() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  const sync = useSyncBalance();
  return useMutation({
    mutationFn: (hearts: number) => walletApi.devGrant(hearts),
    onSuccess: (wallet: WalletDto) => {
      sync(wallet.balance);
      queryClient.invalidateQueries({ queryKey: walletKey });
      show('Hearts granted (dev).', 'success');
    },
    onError: error => show(toApiError(error).message, 'error'),
  });
}

export function useSendGift(clubId: string) {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  const sync = useSyncBalance();
  return useMutation({
    mutationFn: (body: SendGiftRequest) => roomApi.sendGift(clubId, body),
    onSuccess: (result: SendGiftResultDto) => {
      sync(result.balance);
      queryClient.invalidateQueries({ queryKey: walletKey });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'board'] });
    },
    onError: error => {
      const apiError = toApiError(error);
      show(apiError.message, apiError.code === 'gifts.insufficient_hearts' ? 'info' : 'error');
    },
  });
}
