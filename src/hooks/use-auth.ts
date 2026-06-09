"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changePassword,
  completeOnboarding,
  confirmPasswordReset,
  deleteAccount,
  fetchCurrentUser,
  forgotPasswordConfirm,
  forgotPasswordRequest,
  login,
  logout,
  register,
  requestAccountDeletionOtp,
  requestPasswordReset,
  resendEmailVerification,
  updateProfile,
  verifyEmail,
} from "@/services/api/auth";
import type {
  ChangePasswordPayload,
  ConfirmPasswordResetPayload,
  ForgotPasswordConfirmPayload,
  ForgotPasswordRequestPayload,
  LoginPayload,
  RegisterPayload,
  ResendEmailVerificationPayload,
  UpdateProfilePayload,
  VerifyEmailPayload,
} from "@/types/auth";
import { queryKeys } from "@/services/api/query-keys";
import { useBazaarStore } from "@/store/bazaar-store";
import { clearRoleHint, writeRoleHint } from "@/lib/auth-hint";

function normalizeAuthUser(user: Awaited<ReturnType<typeof fetchCurrentUser>>) {
  return { ...user, onBoarding: user.onBoarding ?? false };
}

function applySession(user: Awaited<ReturnType<typeof fetchCurrentUser>>) {
  const normalized = normalizeAuthUser(user);
  useBazaarStore.getState().setAuthed(true);
  useBazaarStore.getState().setUser(normalized);
  // Remember the role so the next cold load can skip the buyer-home flash.
  writeRoleHint(normalized.intent);
  useBazaarStore.getState().setRoleHint(normalized.intent);
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
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) => verifyEmail(payload),
    onSuccess: async (user) => {
      applySession(user);
      await queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

export function useResendEmailVerification() {
  return useMutation({
    mutationFn: (payload: ResendEmailVerificationPayload) => resendEmailVerification(payload),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: async (user) => {
      applySession(user);
      await queryClient.setQueryData(queryKeys.auth.me, user);
      // Owner name drives the seller org payload too.
      await queryClient.invalidateQueries({ queryKey: queryKeys.seller.organization });
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

function clearSessionState(queryClient: ReturnType<typeof useQueryClient>) {
  useBazaarStore.getState().setAuthed(false);
  useBazaarStore.getState().setUser(null);
  clearRoleHint();
  useBazaarStore.getState().setRoleHint(null);
  useBazaarStore.getState().setCart([]);
  useBazaarStore.getState().setWish([]);
  useBazaarStore.getState().setWishSellers([]);
  return Promise.all([
    queryClient.removeQueries({ queryKey: queryKeys.auth.me }),
    queryClient.removeQueries({ queryKey: queryKeys.cart.all }),
    queryClient.removeQueries({ queryKey: queryKeys.wishlist.all }),
    queryClient.removeQueries({ queryKey: ["seller"] }),
  ]);
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await clearSessionState(queryClient);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: requestPasswordReset,
  });
}

export function useConfirmPasswordReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmPasswordResetPayload) => confirmPasswordReset(payload),
    onSuccess: async () => {
      // Server revoked all sessions — wipe local session state to force re-login.
      await clearSessionState(queryClient);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: async () => {
      await clearSessionState(queryClient);
    },
  });
}

export function useRequestAccountDeletionOtp() {
  return useMutation({
    mutationFn: () => requestAccountDeletionOtp(),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { password?: string; otp: string }) => deleteAccount(payload),
    onSuccess: async () => {
      await clearSessionState(queryClient);
    },
  });
}

export function useForgotPasswordRequest() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequestPayload) => forgotPasswordRequest(payload),
  });
}

export function useForgotPasswordConfirm() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordConfirmPayload) => forgotPasswordConfirm(payload),
  });
}
