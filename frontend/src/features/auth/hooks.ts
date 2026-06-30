import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  authApi,
  type LoginPayload,
  type PasswordChangePayload,
  type RegistrationPayload,
  type ReviewerRegistrationPayload,
  type User,
} from "@/features/auth/api";
import { ApiError } from "@/lib/api/client";

const meKey = ["auth", "me"] as const;

export function useMe() {
  return useQuery<User | null>({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403))
          return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (user) => client.setQueryData(meKey, user),
  });
}

export function useRegister() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistrationPayload) => authApi.register(payload),
    onSuccess: (user) => client.setQueryData(meKey, user),
  });
}

export function useRegisterReviewer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewerRegistrationPayload) => authApi.registerReviewer(payload),
    onSuccess: (user) => client.setQueryData(meKey, user),
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      client.clear();
      client.setQueryData(meKey, null);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: PasswordChangePayload) => authApi.changePassword(payload),
  });
}
