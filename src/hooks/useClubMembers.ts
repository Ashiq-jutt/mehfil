import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clubsApi, toApiError, usersApi } from '../api';
import type { ClubAdminsDto, ClubDetailDto } from '../api/types';
import { clubDetailKey } from './useClubs';
import { useToastStore } from '../store/toastStore';

export const clubAdminsKey = (publicId: string, search: string) => ['clubs', 'admins', publicId, search] as const;

export function useClubAdmins(publicId: string | null, search = '', enabled = true) {
  return useQuery({
    queryKey: clubAdminsKey(publicId ?? '', search.trim()),
    queryFn: () => clubsApi.admins(publicId!, search.trim() || null),
    enabled: enabled && !!publicId,
    staleTime: 10_000,
  });
}

function useAdminMutation(publicId: string, mutationFn: (userPublicId: string) => Promise<ClubAdminsDto>, successMessage: string) {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);

  return useMutation({
    mutationFn,
    onSuccess: admins => {
      queryClient.setQueryData(clubAdminsKey(publicId, ''), admins);
      queryClient.invalidateQueries({ queryKey: ['clubs', 'admins', publicId] });
      queryClient.setQueryData<ClubDetailDto>(clubDetailKey(publicId), d =>
        d ? { ...d, adminCount: admins.admins.filter(a => a.role === 'Admin').length } : d,
      );
      show(successMessage, 'success');
    },
    onError: error => show(toApiError(error).message, 'error'),
  });
}

export function usePromoteAdmin(publicId: string) {
  return useAdminMutation(publicId, userPublicId => clubsApi.promoteAdmin(publicId, userPublicId), 'Admin added');
}

export function useDemoteAdmin(publicId: string) {
  return useAdminMutation(publicId, userPublicId => clubsApi.demoteAdmin(publicId, userPublicId), 'Admin removed');
}

export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => usersApi.search(q),
    enabled: q.length >= 2,
    staleTime: 15_000,
    placeholderData: previous => previous,
  });
}
