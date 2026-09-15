import { apiClient } from './client';
import type { Gender, ProfileDto, PublicProfileDto, UpdateProfileRequest, UserDto, UserSearchResultDto } from './types';

export interface AvatarFile {
  uri: string;
  type: string;
  name: string;
}

export const usersApi = {
  async getMe(): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>('/users/me');
    return data;
  },

  async getProfile(): Promise<ProfileDto> {
    const { data } = await apiClient.get<ProfileDto>('/users/me/profile');
    return data;
  },

  async getPublicProfile(publicId: string): Promise<PublicProfileDto> {
    const { data } = await apiClient.get<PublicProfileDto>(`/users/${encodeURIComponent(publicId)}`);
    return data;
  },

  async updateMe(patch: UpdateProfileRequest): Promise<ProfileDto> {
    const { data } = await apiClient.patch<ProfileDto>('/users/me', patch);
    return data;
  },

  async setGender(gender: Gender): Promise<ProfileDto> {
    const { data } = await apiClient.put<ProfileDto>('/users/me/gender', { gender });
    return data;
  },

  async setBirthday(day: number, month: number): Promise<ProfileDto> {
    const { data } = await apiClient.put<ProfileDto>('/users/me/birthday', { day, month });
    return data;
  },

  async deleteMe(): Promise<void> {
    await apiClient.delete('/users/me');
  },

  async search(query: string, limit = 20): Promise<UserSearchResultDto[]> {
    const { data } = await apiClient.get<UserSearchResultDto[]>('/users/search', { params: { q: query, limit } });
    return data;
  },

  async uploadAvatar(file: AvatarFile): Promise<ProfileDto> {
    const form = new FormData();
    // React Native's FormData accepts { uri, type, name } objects for file parts.
    form.append('file', { uri: file.uri, type: file.type, name: file.name } as unknown as Blob);
    const { data } = await apiClient.post<ProfileDto>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    return data;
  },
};
