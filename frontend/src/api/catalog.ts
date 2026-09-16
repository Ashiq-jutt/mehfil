import { apiClient } from './client';
import type { ClubCategoryDto, ClubRuleDto, CountryDto, ReportReasonDto } from './types';

export const catalogApi = {
  async getCountries(): Promise<CountryDto[]> {
    const { data } = await apiClient.get<CountryDto[]>('/catalog/countries');
    return data;
  },

  async getClubCategories(): Promise<ClubCategoryDto[]> {
    const { data } = await apiClient.get<ClubCategoryDto[]>('/catalog/club-categories');
    return data;
  },

  async getClubRules(): Promise<ClubRuleDto[]> {
    const { data } = await apiClient.get<ClubRuleDto[]>('/catalog/club-rules');
    return data;
  },

  async getReportReasons(): Promise<ReportReasonDto[]> {
    const { data } = await apiClient.get<ReportReasonDto[]>('/catalog/report-reasons');
    return data;
  },
};
