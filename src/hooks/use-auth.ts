"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { completeOnboarding, fetchCurrentUser, login, logout, register } from "@/services/api/auth";
import type { LoginPayload, RegisterPayload } from "@/types/auth";
import { queryKeys } from "@/services/api/query-keys";
import { useBazaarStore } from "@/store/bazaar-store";

function normalizeAuthUser(user: Awaited<ReturnType<typeof fetchCurrentUser>>) {
  return { ...user, onBoarding: user.onBoarding ?? false };
}

function applySession(user: Awaited<ReturnType<typeof fetchCurrentUser>>) {
  const normalized = normalizeAuthUser(user);
  useBazaarStore.getState().setAuthed(true);
  useBazaarStore.getState().setUser(normalized);
  return normalized;
}

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await fetchCurrentUser();
      return applySession(user);
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

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
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
      useBazaarStore.getState().setCart([]);
      useBazaarStore.getState().setWish([]);
      useBazaarStore.getState().setWishSellers([]);
      await queryClient.removeQueries({ queryKey: queryKeys.auth.me });
      await queryClient.removeQueries({ queryKey: queryKeys.cart.all });
      await queryClient.removeQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}
