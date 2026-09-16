import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { usersApi } from '../api';
import { useAuthStore } from '../store/authStore';

export const meQueryKey = ['users', 'me'] as const;

/** Fresh profile from the server; falls back to the cached session user while loading. */
export function useMe() {
  const status = useAuthStore(s => s.status);
  const cachedUser = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);

  const query = useQuery({
    queryKey: meQueryKey,
    queryFn: usersApi.getMe,
    enabled: status === 'signedIn',
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data && query.data !== cachedUser) {
      setUser(query.data);
    }
  }, [query.data, cachedUser, setUser]);

  return { ...query, user: query.data ?? cachedUser };
}
