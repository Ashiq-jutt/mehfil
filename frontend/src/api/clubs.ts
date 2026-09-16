import { apiClient } from './client';
import type { AvatarFile } from './users';
import type {
  ClubAdminsDto,
  ClubCardDto,
  ClubDetailDto,
  ClubFeed,
  ClubMemberDto,
  ClubRole,
  CreateClubRequest,
  FollowResultDto,
  MyClubsFilter,
  PagedResult,
  UpdateClubRequest,
} from './types';

const PAGE_SIZE = 20;

export const clubsApi = {
  async list(feed: ClubFeed, country: string | null, page: number): Promise<PagedResult<ClubCardDto>> {
    const { data } = await apiClient.get<PagedResult<ClubCardDto>>('/clubs', {
      params: { feed, country: country && country !== 'GLOBAL' ? country : undefined, page, pageSize: PAGE_SIZE },
    });
    return data;
  },

  async mine(filter: MyClubsFilter, page: number): Promise<PagedResult<ClubCardDto>> {
    const { data } = await apiClient.get<PagedResult<ClubCardDto>>('/clubs/my', { params: { filter, page, pageSize: PAGE_SIZE } });
    return data;
  },

  async top(count = 3): Promise<ClubCardDto[]> {
    const { data } = await apiClient.get<ClubCardDto[]>('/clubs/top', { params: { count } });
    return data;
  },

  async byPublicId(publicId: string): Promise<ClubCardDto> {
    const { data } = await apiClient.get<ClubCardDto>(`/clubs/by-public-id/${encodeURIComponent(publicId)}`);
    return data;
  },

  async get(publicId: string): Promise<ClubDetailDto> {
    const { data } = await apiClient.get<ClubDetailDto>(`/clubs/${encodeURIComponent(publicId)}`);
    return data;
  },

  async create(body: CreateClubRequest): Promise<ClubDetailDto> {
    const { data } = await apiClient.post<ClubDetailDto>('/clubs', body);
    return data;
  },

  async update(publicId: string, body: UpdateClubRequest): Promise<ClubDetailDto> {
    const { data } = await apiClient.patch<ClubDetailDto>(`/clubs/${encodeURIComponent(publicId)}`, body);
    return data;
  },

  async uploadCover(publicId: string, file: AvatarFile): Promise<ClubDetailDto> {
    const form = new FormData();
    form.append('file', { uri: file.uri, type: file.type, name: file.name } as unknown as Blob);
    const { data } = await apiClient.post<ClubDetailDto>(`/clubs/${encodeURIComponent(publicId)}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    return data;
  },

  async members(publicId: string, role: ClubRole | null, search: string | null, page: number): Promise<PagedResult<ClubMemberDto>> {
    const { data } = await apiClient.get<PagedResult<ClubMemberDto>>(`/clubs/${encodeURIComponent(publicId)}/members`, {
      params: { role: role ?? undefined, search: search || undefined, page, pageSize: PAGE_SIZE },
    });
    return data;
  },

  async admins(publicId: string, search: string | null): Promise<ClubAdminsDto> {
    const { data } = await apiClient.get<ClubAdminsDto>(`/clubs/${encodeURIComponent(publicId)}/admins`, {
      params: { search: search || undefined },
    });
    return data;
  },

  async promoteAdmin(publicId: string, userPublicId: string): Promise<ClubAdminsDto> {
    const { data } = await apiClient.put<ClubAdminsDto>(`/clubs/${encodeURIComponent(publicId)}/admins/${encodeURIComponent(userPublicId)}`);
    return data;
  },

  async demoteAdmin(publicId: string, userPublicId: string): Promise<ClubAdminsDto> {
    const { data } = await apiClient.delete<ClubAdminsDto>(`/clubs/${encodeURIComponent(publicId)}/admins/${encodeURIComponent(userPublicId)}`);
    return data;
  },

  async follow(publicId: string): Promise<FollowResultDto> {
    const { data } = await apiClient.post<FollowResultDto>(`/clubs/${encodeURIComponent(publicId)}/follow`);
    return data;
  },

  async unfollow(publicId: string): Promise<FollowResultDto> {
    const { data } = await apiClient.delete<FollowResultDto>(`/clubs/${encodeURIComponent(publicId)}/follow`);
    return data;
  },
};

/** Server pages are 1-based; returns the next page number or undefined when exhausted. */
export function nextPageOf<T>(page: PagedResult<T>): number | undefined {
  return page.page * page.pageSize < page.totalCount ? page.page + 1 : undefined;
}
