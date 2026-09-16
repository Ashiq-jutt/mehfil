import { apiClient } from './client';
import type { DevicePlatform, NotificationListDto, NotificationSettingsDto } from './types';

export const notificationsApi = {
  async list(page = 1, pageSize = 20): Promise<NotificationListDto> {
    const { data } = await apiClient.get<NotificationListDto>('/notifications', { params: { page, pageSize } });
    return data;
  },

  async markRead(id: number): Promise<number> {
    const { data } = await apiClient.post<number>(`/notifications/${id}/read`);
    return data;
  },

  async markAllRead(): Promise<number> {
    const { data } = await apiClient.post<number>('/notifications/read-all');
    return data;
  },

  async settings(): Promise<NotificationSettingsDto> {
    const { data } = await apiClient.get<NotificationSettingsDto>('/notifications/settings');
    return data;
  },

  async updateSettings(settings: NotificationSettingsDto): Promise<NotificationSettingsDto> {
    const { data } = await apiClient.put<NotificationSettingsDto>('/notifications/settings', settings);
    return data;
  },

  async registerDevice(platform: DevicePlatform, token: string): Promise<void> {
    await apiClient.put('/users/me/device-token', { platform, token });
  },

  async unregisterDevice(token: string): Promise<void> {
    await apiClient.post('/users/me/device-token/unregister', { token });
  },
};
