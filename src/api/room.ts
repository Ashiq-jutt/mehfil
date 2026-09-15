import { apiClient } from './client';
import type { ClubBanDto, ClubMessageDto, RoomStateDto, SeatDto, VoiceTokenDto } from './types';

const room = (publicId: string) => `/clubs/${encodeURIComponent(publicId)}/room`;

export const roomApi = {
  async state(publicId: string): Promise<RoomStateDto> {
    const { data } = await apiClient.get<RoomStateDto>(`${room(publicId)}/state`);
    return data;
  },

  /** Oldest-first page of messages with id < before. */
  async messages(publicId: string, before: number | null, limit = 30): Promise<ClubMessageDto[]> {
    const { data } = await apiClient.get<ClubMessageDto[]>(`${room(publicId)}/messages`, { params: { before: before ?? undefined, limit } });
    return data;
  },

  async deleteMessage(publicId: string, messageId: number): Promise<void> {
    await apiClient.delete(`${room(publicId)}/messages/${messageId}`);
  },

  async setAnnouncement(publicId: string, text: string | null): Promise<void> {
    await apiClient.put(`${room(publicId)}/announcement`, { text });
  },

  async takeSeat(publicId: string, index: number): Promise<SeatDto> {
    const { data } = await apiClient.post<SeatDto>(`${room(publicId)}/seats/${index}/take`);
    return data;
  },

  async leaveSeat(publicId: string): Promise<void> {
    await apiClient.post(`${room(publicId)}/seats/leave`);
  },

  async lockSeat(publicId: string, index: number, locked: boolean): Promise<SeatDto> {
    const { data } = await apiClient.post<SeatDto>(`${room(publicId)}/seats/${index}/lock`, { locked });
    return data;
  },

  async muteSeat(publicId: string, index: number, muted: boolean): Promise<SeatDto> {
    const { data } = await apiClient.post<SeatDto>(`${room(publicId)}/seats/${index}/mute`, { muted });
    return data;
  },

  async kickFromSeat(publicId: string, index: number): Promise<SeatDto> {
    const { data } = await apiClient.post<SeatDto>(`${room(publicId)}/seats/${index}/kick`);
    return data;
  },

  async kickUser(publicId: string, userPublicId: string): Promise<void> {
    await apiClient.post(`${room(publicId)}/kick/${encodeURIComponent(userPublicId)}`);
  },

  async banUser(publicId: string, userPublicId: string, reason: string | null): Promise<ClubBanDto> {
    const { data } = await apiClient.post<ClubBanDto>(`${room(publicId)}/bans/${encodeURIComponent(userPublicId)}`, { reason });
    return data;
  },

  async unbanUser(publicId: string, userPublicId: string): Promise<void> {
    await apiClient.delete(`${room(publicId)}/bans/${encodeURIComponent(userPublicId)}`);
  },

  async voiceToken(publicId: string): Promise<VoiceTokenDto> {
    const { data } = await apiClient.post<VoiceTokenDto>(`${room(publicId)}/voice-token`);
    return data;
  },

  async bans(publicId: string): Promise<ClubBanDto[]> {
    const { data } = await apiClient.get<ClubBanDto[]>(`${room(publicId)}/bans`);
    return data;
  },
};
