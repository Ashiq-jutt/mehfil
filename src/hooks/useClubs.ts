import { InfiniteData, QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AvatarFile, clubsApi, nextPageOf, toApiError } from '../api';
import type {
  ClubCardDto,
  ClubDetailDto,
  ClubFeed,
  CreateClubRequest,
  MyClubsFilter,
  PagedResult,
  UpdateClubRequest,
} from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useClubsFilterStore } from '../store/clubsFilterStore';
import { useToastStore } from '../store/toastStore';

export const clubsRootKey = ['clubs'] as const;
export const clubDetailKey = (publicId: string) => ['clubs', 'detail', publicId] as const;

export function useClubsFeed(feed: ClubFeed) {
  const status = useAuthStore(s => s.status);
  const country = useClubsFilterStore(s => s.country.code);

  return useInfiniteQuery({
    queryKey: ['clubs', 'feed', feed, country],
    queryFn: ({ pageParam }) => clubsApi.list(feed, country, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: status === 'signedIn',
    staleTime: 20_000,
  });
}

export function useMyClubs(filter: MyClubsFilter) {
  const status = useAuthStore(s => s.status);
  return useInfiniteQuery({
    queryKey: ['clubs', 'my', filter],
    queryFn: ({ pageParam }) => clubsApi.mine(filter, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: status === 'signedIn',
    staleTime: 10_000,
  });
}

export function useTopClubs() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: ['clubs', 'top'],
    queryFn: () => clubsApi.top(3),
    enabled: status === 'signedIn',
    staleTime: 60_000,
  });
}

export function useClub(publicId: string | null) {
  return useQuery({
    queryKey: clubDetailKey(publicId ?? ''),
    queryFn: () => clubsApi.get(publicId!),
    enabled: !!publicId,
    staleTime: 15_000,
  });
}

/** Flattens infinite pages into one list. */
export function flattenPages<T>(data: InfiniteData<PagedResult<T>> | undefined): T[] {
  return data?.pages.flatMap(p => p.items) ?? [];
}

/** Applies a patch to every cached copy of a club card (feeds, my tab, top). */
function patchCards(queryClient: QueryClient, publicId: string, patch: Partial<ClubCardDto>) {
  queryClient.setQueriesData<InfiniteData<PagedResult<ClubCardDto>>>({ queryKey: ['clubs', 'feed'] }, patchInfinite);
  queryClient.setQueriesData<InfiniteData<PagedResult<ClubCardDto>>>({ queryKey: ['clubs', 'my'] }, patchInfinite);
  queryClient.setQueryData<ClubCardDto[]>(['clubs', 'top'], list => list?.map(c => (c.id === publicId ? { ...c, ...patch } : c)));

  function patchInfinite(data: InfiniteData<PagedResult<ClubCardDto>> | undefined) {
    if (!data) {
      return data;
    }
    return {
      ...data,
      pages: data.pages.map(page => ({ ...page, items: page.items.map(c => (c.id === publicId ? { ...c, ...patch } : c)) })),
    };
  }
}

export function useFollowClub() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);

  return useMutation({
    mutationFn: ({ publicId, follow }: { publicId: string; follow: boolean }) =>
      follow ? clubsApi.follow(publicId) : clubsApi.unfollow(publicId),
    onMutate: ({ publicId, follow }) => {
      patchCards(queryClient, publicId, { isFollowing: follow });
      queryClient.setQueryData<ClubDetailDto>(clubDetailKey(publicId), d => (d ? { ...d, isFollowing: follow } : d));
    },
    onSuccess: (result, { publicId }) => {
      patchCards(queryClient, publicId, { isFollowing: result.isFollowing, followerCount: result.followerCount });
      queryClient.setQueryData<ClubDetailDto>(clubDetailKey(publicId), d =>
        d ? { ...d, isFollowing: result.isFollowing, followerCount: result.followerCount } : d,
      );
      queryClient.invalidateQueries({ queryKey: ['clubs', 'my', 'Followed'] });
      show(result.isFollowing ? 'Followed! Added to "My Clubs"' : 'Unfollowed! Removed from "My Clubs"', 'success');
    },
    onError: (error, { publicId, follow }) => {
      patchCards(queryClient, publicId, { isFollowing: !follow });
      queryClient.setQueryData<ClubDetailDto>(clubDetailKey(publicId), d => (d ? { ...d, isFollowing: !follow } : d));
      show(toApiError(error).message, 'error');
    },
  });
}

function useClubWriteMutation<TVars>(mutationFn: (vars: TVars) => Promise<ClubDetailDto>, successMessage: string) {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);

  return useMutation({
    mutationFn,
    onSuccess: club => {
      queryClient.setQueryData(clubDetailKey(club.id), club);
      queryClient.invalidateQueries({ queryKey: clubsRootKey });
      show(successMessage, 'success');
    },
    onError: error => show(toApiError(error).message, 'error'),
  });
}

export function useCreateClub() {
  return useClubWriteMutation((body: CreateClubRequest) => clubsApi.create(body), 'Club created');
}

export function useUpdateClub(publicId: string) {
  return useClubWriteMutation((body: UpdateClubRequest) => clubsApi.update(publicId, body), 'Club updated');
}

export function useUploadClubCover(publicId: string) {
  return useClubWriteMutation((file: AvatarFile) => clubsApi.uploadCover(publicId, file), 'Cover updated');
}

export function useClubLookup() {
  return useMutation({ mutationFn: (publicId: string) => clubsApi.byPublicId(publicId) });
}
