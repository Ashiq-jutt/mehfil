import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AvatarFile, toApiError, usersApi } from '../api';
import type { Gender, ProfileDto, UpdateProfileRequest } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { meQueryKey } from './useMe';

export const profileQueryKey = ['users', 'me', 'profile'] as const;

export function useProfile() {
  const status = useAuthStore(s => s.status);
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: usersApi.getProfile,
    enabled: status === 'signedIn',
    staleTime: 30_000,
  });
}

/** Shared plumbing: write the returned profile into the cache and the session user. */
function useProfileMutation<TVars>(mutationFn: (vars: TVars) => Promise<ProfileDto>, successMessage?: string) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);
  const show = useToastStore(s => s.show);

  return useMutation({
    mutationFn,
    onSuccess: profile => {
      queryClient.setQueryData(profileQueryKey, profile);
      queryClient.setQueryData(meQueryKey, profile.user);
      setUser(profile.user);
      if (successMessage) {
        show(successMessage, 'success');
      }
    },
    onError: error => {
      show(toApiError(error).message, 'error');
    },
  });
}

export function useUpdateProfile() {
  return useProfileMutation((patch: UpdateProfileRequest) => usersApi.updateMe(patch), 'Profile updated');
}

export function useSetGender() {
  return useProfileMutation((gender: Gender) => usersApi.setGender(gender), 'Gender saved');
}

export function useSetBirthday() {
  return useProfileMutation(({ day, month }: { day: number; month: number }) => usersApi.setBirthday(day, month), 'Birthday saved');
}

export function useUploadAvatar() {
  return useProfileMutation((file: AvatarFile) => usersApi.uploadAvatar(file), 'Photo updated');
}
