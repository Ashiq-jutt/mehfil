import { useQuery } from '@tanstack/react-query';

import { royaltyApi, usersApi } from '../api';
import { useAuthStore } from '../store/authStore';

export function useRoyalty(enabled = true) {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: ['royalty'],
    queryFn: royaltyApi.get,
    enabled: enabled && status === 'signedIn',
    staleTime: 60_000,
  });
}

export function usePublicProfile(publicId: string | null) {
  return useQuery({
    queryKey: ['users', 'public', publicId],
    queryFn: () => usersApi.getPublicProfile(publicId!),
    enabled: !!publicId,
    staleTime: 30_000,
  });
}
