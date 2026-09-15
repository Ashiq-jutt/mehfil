import { apiClient } from './client';
import type { ClubCategoryDto, CountryDto } from './types';

export const catalogApi = {
  async getCountries(): Promise<CountryDto[]> {
    const { data } = await apiClient.get<CountryDto[]>('/catalog/countries');
    return data;
  },

  async getClubCategories(): Promise<ClubCategoryDto[]> {
    const { data } = await apiClient.get<ClubCategoryDto[]>('/catalog/club-categories');
    return data;
  },
};
