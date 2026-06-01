"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerApi, type CreateProductPayload } from "@/services/api/seller";
import {
  sellerOrganizationApi,
  type SetupSellerOrganizationPayload,
} from "@/services/api/seller-organization";
import {
  sellerVerificationApi,
  type SubmitSellerVerificationPayload,
} from "@/services/api/seller-verification";
import {
  sellerSettingsApi,
  type UpdateSellerSettingsPayload,
} from "@/services/api/seller-settings";
import { storefrontApi, type UpdateStorefrontPayload } from "@/services/api/storefront";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useSellerOrganization() {
  return useQuery({
    queryKey: queryKeys.seller.organization,
    queryFn: () => sellerOrganizationApi.getOrganization(),
    staleTime: STALE_TIME,
  });
}

export function useSetupSellerOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetupSellerOrganizationPayload) =>
      sellerOrganizationApi.setupOrganization(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.organization, data);
      void qc.invalidateQueries({ queryKey: queryKeys.seller.storefront });
      void qc.invalidateQueries({ queryKey: queryKeys.seller.settings });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => sellerApi.createProduct(payload),
    onSuccess: () => {
      // Refresh the seller's inventory plus the public catalog lists that
      // surface the new product.
      void qc.invalidateQueries({ queryKey: queryKeys.seller.inventory });
      void qc.invalidateQueries({ queryKey: queryKeys.catalog.products() });
    },
  });
}

export function useSubmitSellerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitSellerVerificationPayload) =>
      sellerVerificationApi.submitDocument(payload),
    onSuccess: (verification) => {
      qc.setQueryData(queryKeys.seller.organization, (prev) =>
        prev ? { ...prev, verification } : prev,
      );
    },
  });
}

export function useSellerDashboard() {
  return useQuery({
    queryKey: queryKeys.seller.dashboard,
    queryFn: () => sellerApi.getDashboard(),
    staleTime: STALE_TIME,
  });
}

export function useSellerInbox() {
  return useQuery({
    queryKey: queryKeys.seller.inbox,
    queryFn: () => sellerApi.getInbox(),
    staleTime: STALE_TIME,
  });
}

export function useSellerInventory() {
  return useQuery({
    queryKey: queryKeys.seller.inventory,
    queryFn: () => sellerApi.getInventory(),
    staleTime: STALE_TIME,
  });
}

export function useSellerBargains() {
  return useQuery({
    queryKey: queryKeys.seller.bargains,
    queryFn: () => sellerApi.getBargains(),
    staleTime: STALE_TIME,
  });
}

export function useSellerReviews() {
  return useQuery({
    queryKey: queryKeys.seller.reviews,
    queryFn: () => sellerApi.getReviews(),
    staleTime: STALE_TIME,
  });
}

export function useSellerChat() {
  return useQuery({
    queryKey: queryKeys.seller.chat,
    queryFn: () => sellerApi.getChat(),
    staleTime: STALE_TIME,
  });
}

export function useSellerPromotions() {
  return useQuery({
    queryKey: queryKeys.seller.promotions,
    queryFn: () => sellerApi.getPromotions(),
    staleTime: STALE_TIME,
  });
}

export function useSellerVideos() {
  return useQuery({
    queryKey: queryKeys.seller.videos,
    queryFn: () => sellerApi.getVideos(),
    staleTime: STALE_TIME,
  });
}

export function useSellerAnalytics() {
  return useQuery({
    queryKey: queryKeys.seller.analytics,
    queryFn: () => sellerApi.getAnalytics(),
    staleTime: STALE_TIME,
  });
}

export function useSellerReports() {
  return useQuery({
    queryKey: queryKeys.seller.reports,
    queryFn: () => sellerApi.getReports(),
    staleTime: STALE_TIME,
  });
}

export function useSellerNotifications() {
  return useQuery({
    queryKey: queryKeys.seller.notifications,
    queryFn: () => sellerApi.getNotifications(),
    staleTime: STALE_TIME,
  });
}

export function useSellerStorefront() {
  return useQuery({
    queryKey: queryKeys.seller.storefront,
    queryFn: () => sellerApi.getStorefront(),
    staleTime: STALE_TIME,
  });
}

export function useUpdateStorefront() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStorefrontPayload) => storefrontApi.updateStorefront(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.storefront, data);
    },
  });
}

export function useUploadStorefrontLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => storefrontApi.uploadLogo(file),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.storefront, data);
    },
  });
}

export function useUploadStorefrontBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => storefrontApi.uploadBanner(file),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.storefront, data);
    },
  });
}

export function useSellerLedger() {
  return useQuery({
    queryKey: queryKeys.seller.ledger,
    queryFn: () => sellerApi.getLedger(),
    staleTime: STALE_TIME,
  });
}

export function useSellerSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.seller.settings,
    queryFn: () => sellerSettingsApi.getSettings(),
    staleTime: STALE_TIME,
    enabled,
  });
}

export function useUpdateSellerSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSellerSettingsPayload) => sellerSettingsApi.updateSettings(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.settings, data);
    },
  });
}
