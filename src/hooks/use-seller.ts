"use client";

import { useQuery } from "@tanstack/react-query";
import { sellerApi } from "@/services/api/seller";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 60 * 1000;

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

export function useSellerLedger() {
  return useQuery({
    queryKey: queryKeys.seller.ledger,
    queryFn: () => sellerApi.getLedger(),
    staleTime: STALE_TIME,
  });
}
