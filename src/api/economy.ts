import { apiClient } from './client';
import type { GiftDto, PurchaseResultDto, ShopDto, VerifyPurchaseRequest, WalletDto } from './types';

export const walletApi = {
  async get(page = 1, pageSize = 20): Promise<WalletDto> {
    const { data } = await apiClient.get<WalletDto>('/wallet', { params: { page, pageSize } });
    return data;
  },

  async shop(): Promise<ShopDto> {
    const { data } = await apiClient.get<ShopDto>('/wallet/shop');
    return data;
  },

  async verifyPurchase(body: VerifyPurchaseRequest): Promise<PurchaseResultDto> {
    const { data } = await apiClient.post<PurchaseResultDto>('/wallet/purchases/verify', body);
    return data;
  },

  async devGrant(hearts: number): Promise<WalletDto> {
    const { data } = await apiClient.post<WalletDto>('/wallet/dev-grant', { hearts });
    return data;
  },
};

export const giftsApi = {
  async catalog(): Promise<GiftDto[]> {
    const { data } = await apiClient.get<GiftDto[]>('/gifts');
    return data;
  },
};
