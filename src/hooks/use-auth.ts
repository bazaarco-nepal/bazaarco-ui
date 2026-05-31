"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchCurrentUser, login, logout, register } from "@/services/api/auth";
import type { LoginPayload, RegisterPayload } from "@/types/auth";
import { queryKeys } from "@/services/api/query-keys";
import { useBazaarStore } from "@/store/bazaar-store";

function applySession(user: Awaited<ReturnType<typeof fetchCurrentUser>>) {
  useBazaarStore.getState().setAuthed(true);
  useBazaarStore.getState().setUser(user);
}

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await fetchCurrentUser();
      applySession(user);
      return user;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async (user) => {
      applySession(user);
      await queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: async (user) => {
      applySession(user);
      await queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      useBazaarStore.getState().setAuthed(false);
      useBazaarStore.getState().setUser(null);
      await queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
