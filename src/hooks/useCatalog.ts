import { useQuery } from '@tanstack/react-query';

import { catalogApi } from '../api';
import { useAuthStore } from '../store/authStore';

export function useCountries() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: ['catalog', 'countries'],
    queryFn: catalogApi.getCountries,
    enabled: status === 'signedIn',
    staleTime: 60 * 60_000,
  });
}

export function useClubCategories() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: ['catalog', 'club-categories'],
    queryFn: catalogApi.getClubCategories,
    enabled: status === 'signedIn',
    staleTime: 60 * 60_000,
  });
}
