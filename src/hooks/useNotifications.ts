import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { nextPageOf, notificationsApi, toApiError } from '../api';
import type { NotificationSettingsDto } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

export const notificationsRootKey = ['notifications'] as const;
export const notificationsListKey = ['notifications', 'list'] as const;
export const unreadCountKey = ['notifications', 'unread'] as const;
export const notificationSettingsKey = ['notifications', 'settings'] as const;

export function useNotifications() {
  const status = useAuthStore(s => s.status);
  return useInfiniteQuery({
    queryKey: notificationsListKey,
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: last => nextPageOf(last.notifications),
    enabled: status === 'signedIn',
    staleTime: 15_000,
  });
}

/** Unread badge count, refreshed every minute and whenever the list changes. */
export function useUnreadCount(): number {
  const status = useAuthStore(s => s.status);
  const query = useQuery({
    queryKey: unreadCountKey,
    queryFn: async () => (await notificationsApi.list(1, 1)).unreadCount,
    enabled: status === 'signedIn',
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  return query.data ?? 0;
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: unread => {
      queryClient.setQueryData(unreadCountKey, unread);
      queryClient.invalidateQueries({ queryKey: notificationsListKey });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(unreadCountKey, 0);
      queryClient.invalidateQueries({ queryKey: notificationsListKey });
    },
  });
}

export function useNotificationSettings() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: notificationSettingsKey,
    queryFn: notificationsApi.settings,
    enabled: status === 'signedIn',
    staleTime: 60_000,
  });
}

/** Optimistic toggle: the switch flips immediately and rolls back if the server rejects it. */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const show = useToastStore(s => s.show);
  return useMutation({
    mutationFn: (settings: NotificationSettingsDto) => notificationsApi.updateSettings(settings),
    onMutate: async settings => {
      await queryClient.cancelQueries({ queryKey: notificationSettingsKey });
      const previous = queryClient.getQueryData<NotificationSettingsDto>(notificationSettingsKey);
      queryClient.setQueryData(notificationSettingsKey, settings);
      return { previous };
    },
    onError: (error, _settings, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationSettingsKey, context.previous);
      }
      show(toApiError(error).message, 'error');
    },
    onSuccess: settings => queryClient.setQueryData(notificationSettingsKey, settings),
  });
}
