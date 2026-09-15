import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { PropsWithChildren, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from '../api';
import { ToastHost } from '../components/ui/ToastHost';
import { useAuthStore } from '../store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't hammer the API on auth/validation failures; retry transient ones twice.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 400)) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

function SessionBootstrap({ children }: PropsWithChildren) {
  const restore = useAuthStore(s => s.restore);
  const status = useAuthStore(s => s.status);

  useEffect(() => {
    restore().catch(() => useAuthStore.setState({ status: 'signedOut' }));
  }, [restore]);

  useEffect(() => {
    if (status === 'signedOut') {
      queryClient.clear();
    }
  }, [status]);

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>{children}</SessionBootstrap>
        <ToastHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
