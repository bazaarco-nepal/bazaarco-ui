"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  sellerApi,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "@/seller/api/seller";
import type { SellerVideosResponse } from "@/shared/api/media";
import type { SuborderStatus } from "@/shared/lib/order-utils";
import type { SellerReview } from "@/types/catalog";
import {
  sellerOrganizationApi,
  type SetupSellerOrganizationPayload,
} from "@/seller/api/seller-organization";
import {
  sellerVerificationApi,
  type SubmitSellerVerificationPayload,
} from "@/seller/api/seller-verification";
import { sellerSettingsApi, type UpdateSellerSettingsPayload } from "@/seller/api/seller-settings";
import { storefrontApi, type UpdateStorefrontPayload } from "@/seller/api/storefront";
import { queryKeys } from "@/shared/api/query-keys";

const STALE_TIME = 60 * 1000;

// View-models for the seller dashboard/analytics aggregates the API returns.
// These mirror the display-only shapes the rendering code reads.
export interface SellerChartPoint {
  label: string;
  value: number;
}

export interface SellerTopProduct {
  icon: string;
  name: string;
  rev: string | number;
  units: number;
  spark?: number[];
}

export interface SellerKpi {
  label: string;
  value: string | number;
  delta?: number;
  up?: boolean;
  color?: string;
  spark?: number[];
  couriers?: { name: string; to: string; amount: string }[];
}

export interface SellerDashboardData {
  salesByDay?: SellerChartPoint[];
  paymentSplit?: { label: string; value: number; color: string }[];
  funnel?: SellerChartPoint[];
  topProducts?: SellerTopProduct[];
  activity?: { icon: string; color: string; t: string; text: string }[];
  kpis?: SellerKpi[];
  bargainGlance?: {
    pending: number;
    accepted: number;
    avgGiven: number;
    marginGiven: number;
  };
}

export interface SellerAnalyticsData {
  salesByDay?: SellerChartPoint[];
  topProducts?: SellerTopProduct[];
  moneyBuckets?: { c: string; en: string; v: number }[];
  followers?: {
    total: number;
    new7d: number;
    new30d: number;
    trend7d: SellerChartPoint[];
  };
}

export interface SellerLedgerData {
  rows?: {
    date: string;
    status: string;
    cash: string | number;
    fee: string | number;
    net: string | number;
  }[];
}

export interface SellerNotificationsData {
  items?: { id: string; title: string; body: string; time: string }[];
}

export interface SellerBargainOffer {
  id: string;
  buyer: string;
  buyerAvatarUrl?: string | null;
  city: string;
  product: string;
  listed: number;
  offered: number;
  yourOffer?: number;
  sellerCounter?: number | null;
  time: string;
  status?: string;
  accepted?: boolean;
  rejected?: boolean;
  /** Where the offer sits vs the seller's private floor — server-computed nudge. */
  recommendation?: "strong" | "fair" | "low";
  /** Open-offer response deadline (ISO), for the inbox countdown. Null once settled. */
  expiresAt?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSellerBargainOffer(raw: any): SellerBargainOffer {
  // The API speaks rupees — pass amounts through, only normalising nullable counter.
  return {
    ...raw,
    sellerCounter: raw.sellerCounter ?? null,
  };
}

export function useSellerOrganization() {
  return useQuery({
    queryKey: queryKeys.seller.organization,
    queryFn: () => sellerOrganizationApi.getOrganization(),
    staleTime: STALE_TIME,
  });
}

function invalidateSellerWorkspace(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["seller"] });
  // Chat is keyed under ["chat"], not ["seller"], but the inbox and unread badge are
  // scoped to the active store server-side — so switching stores must refresh them too,
  // otherwise the seller keeps seeing the previous store's threads until a manual reload.
  void qc.invalidateQueries({ queryKey: ["chat"] });
}

export function useSetupSellerOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetupSellerOrganizationPayload) =>
      sellerOrganizationApi.setupOrganization(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.organization, data);
      invalidateSellerWorkspace(qc);
    },
  });
}

export function useCreateSellerStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetupSellerOrganizationPayload) =>
      sellerOrganizationApi.createStore(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.organization, data);
      invalidateSellerWorkspace(qc);
    },
  });
}

export function useSwitchActiveStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sellerId: string) => sellerOrganizationApi.switchActiveStore(sellerId),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.organization, data);
      invalidateSellerWorkspace(qc);
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

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload & { id: string }) =>
      sellerApi.updateProduct(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.seller.inventory });
      void qc.invalidateQueries({ queryKey: queryKeys.catalog.products() });
      void qc.invalidateQueries({ queryKey: queryKeys.catalog.product(id) });
    },
  });
}

export function useAcknowledgeProductModeration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sellerApi.acknowledgeProductModeration(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.seller.inventory });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sellerApi.deleteProduct(id),
    onSuccess: ({ id }) => {
      // Drop the seller's inventory plus every public catalog list that may
      // still surface the now-deleted product.
      void qc.invalidateQueries({ queryKey: queryKeys.seller.inventory });
      void qc.invalidateQueries({ queryKey: queryKeys.catalog.products() });
      void qc.removeQueries({ queryKey: queryKeys.catalog.product(id) });
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

export function useSellerDashboard(range = "week") {
  return useQuery({
    queryKey: queryKeys.seller.dashboard(range),
    queryFn: () => sellerApi.getDashboard<SellerDashboardData>(range),
    // Keep the previous range's data on screen while the next loads, so
    // toggling Today / 7 days / 30 days doesn't blank the dashboard.
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  });
}

export function useSellerInbox() {
  const { data: organization } = useSellerOrganization();
  const sellerId = organization?.sellerId ?? null;
  return useQuery({
    queryKey: queryKeys.seller.inbox(sellerId),
    queryFn: () => sellerApi.getInbox(),
    enabled: Boolean(sellerId),
    staleTime: STALE_TIME,
  });
}

export function useUpdateSellerOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SuborderStatus }) =>
      sellerApi.updateOrderStatus(id, status),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ["seller", "inbox"] });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.list });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.tracking(order.id) });
    },
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
    queryFn: async () => {
      const raw = await sellerApi.getBargains<unknown[]>();
      return raw.map(mapSellerBargainOffer);
    },
    staleTime: STALE_TIME,
  });
}

export function useSellerReviews() {
  return useQuery({
    queryKey: queryKeys.seller.reviews,
    queryFn: () => sellerApi.getReviews<SellerReview[]>(),
    staleTime: STALE_TIME,
  });
}

const SELLER_LIST_PAGE_SIZE = 20;

export function useSellerQuestions(opts?: {
  status?: "pending" | "answered";
  product?: string | null;
}) {
  const status = opts?.status;
  const product = opts?.product ?? undefined;
  return useInfiniteQuery({
    queryKey: queryKeys.seller.questions(`${status ?? "all"}:${product ?? "all"}`),
    queryFn: ({ pageParam }) =>
      sellerApi.getQuestions({ page: pageParam, limit: SELLER_LIST_PAGE_SIZE, status, product }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME,
  });
}

export function useAnswerProductQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      questionId,
      text,
    }: {
      productId: string;
      questionId: string;
      text: string;
    }) => sellerApi.answerQuestion(productId, questionId, text),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: ["seller", "questions"] });
      void qc.invalidateQueries({ queryKey: queryKeys.catalog.productQuestions(productId) });
    },
  });
}

export function useSellerProductReviews(opts?: { product?: string | null }) {
  const product = opts?.product ?? undefined;
  return useInfiniteQuery({
    queryKey: queryKeys.seller.productReviews(product ?? "all"),
    queryFn: ({ pageParam }) =>
      sellerApi.getProductReviews({ page: pageParam, limit: SELLER_LIST_PAGE_SIZE, product }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME,
  });
}

export function useSellerVideos() {
  return useQuery({
    queryKey: queryKeys.seller.videos,
    queryFn: () => sellerApi.getVideos<SellerVideosResponse>(),
    staleTime: STALE_TIME,
  });
}

export function useSellerAnalytics() {
  return useQuery({
    queryKey: queryKeys.seller.analytics,
    queryFn: () => sellerApi.getAnalytics<SellerAnalyticsData>(),
    staleTime: STALE_TIME,
  });
}

export function useSellerNotifications() {
  return useQuery({
    queryKey: queryKeys.seller.notifications,
    queryFn: () => sellerApi.getNotifications<SellerNotificationsData>(),
    staleTime: STALE_TIME,
  });
}

export function useSellerStorefront(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.seller.storefront,
    queryFn: () => sellerApi.getStorefront(),
    staleTime: STALE_TIME,
    enabled: options?.enabled ?? true,
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

export function useUpdateStoreHandle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => storefrontApi.updateHandle(handle),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.storefront, data);
      // The store-link card reads the handle from the organization query.
      void qc.invalidateQueries({ queryKey: queryKeys.seller.organization });
    },
  });
}

export function useUploadStorefrontLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => storefrontApi.uploadLogo(file),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.storefront, data);
      // The sidebar brand reads the logo from the organization query — refresh it
      // so the new shop logo appears live, without a page reload.
      void qc.invalidateQueries({ queryKey: queryKeys.seller.organization });
    },
  });
}

export function useRemoveStorefrontLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => storefrontApi.removeLogo(),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.seller.storefront, data);
      void qc.invalidateQueries({ queryKey: queryKeys.seller.organization });
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
    queryFn: () => sellerApi.getLedger<SellerLedgerData>(),
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
