import { apiClient } from './client';
import type { BuyResultDto, EquipResultDto, StoreDto } from './types';

export const storeApi = {
  async get(): Promise<StoreDto> {
    const { data } = await apiClient.get<StoreDto>('/store');
    return data;
  },

  async equip(code: string): Promise<EquipResultDto> {
    const { data } = await apiClient.post<EquipResultDto>(`/store/items/${encodeURIComponent(code)}/equip`);
    return data;
  },

  async buy(code: string): Promise<BuyResultDto> {
    const { data } = await apiClient.post<BuyResultDto>(`/store/items/${encodeURIComponent(code)}/buy`);
    return data;
  },
};
