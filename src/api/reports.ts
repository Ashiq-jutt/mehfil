import { apiClient } from './client';
import type { CreateReportRequest, ReportDto } from './types';

export const reportsApi = {
  async create(body: CreateReportRequest): Promise<ReportDto> {
    const { data } = await apiClient.post<ReportDto>('/reports', body);
    return data;
  },
};
