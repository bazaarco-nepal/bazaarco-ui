"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  catalogApi,
  type CreateProductQuestionPayload,
  type CreateProductReviewPayload,
  type CreateSellerReviewPayload,
  type ProductListParams,
} from "@/services/api/catalog";
import { queryKeys } from "@/services/api/query-keys";
import type { CategoryAttributeField, Product, Seller } from "@/types";

const STALE_TIME = 5 * 60 * 1000;
const PICKS_PAGE_SIZE = 12;

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => catalogApi.getCategories(),
    staleTime: STALE_TIME,
  });
}

export function useSellers() {
  return useQuery({
    queryKey: queryKeys.catalog.sellers,
    queryFn: () => catalogApi.getSellers(),
    staleTime: STALE_TIME,
  });
}

export function useSeller(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.seller(id ?? ""),
    queryFn: () => catalogApi.getSeller(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useSellerReviews(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.sellerReviews(id ?? ""),
    queryFn: () => catalogApi.getSellerReviews(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useSellerProducts(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.sellerProducts(id ?? ""),
    queryFn: () => catalogApi.getSellerProducts(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useCreateSellerReview(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSellerReviewPayload) =>
      catalogApi.createSellerReview(sellerId!, payload),
    onSuccess: async () => {
      if (!sellerId) return;
      // Refresh the store's reviews + its denormalized rating, and the seller
      // lists/cards that surface that rating elsewhere.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.sellerReviews(sellerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.seller(sellerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.sellers }),
      ]);
    },
  });
}

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.catalog.products(params),
    queryFn: () => catalogApi.getProducts(params),
    staleTime: STALE_TIME,
  });
}

export function useAllProducts() {
  return useProducts({ page: 1, limit: 100 });
}

export function useTopPicks(days = 7) {
  return useInfiniteQuery({
    queryKey: queryKeys.catalog.topPicks(days),
    queryFn: ({ pageParam }) =>
      catalogApi.getTopPicks({ days, page: pageParam, limit: PICKS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME,
  });
}

export function useNewArrivals() {
  return useInfiniteQuery({
    queryKey: queryKeys.catalog.newArrivals,
    queryFn: ({ pageParam }) =>
      catalogApi.getNewArrivals({ page: pageParam, limit: PICKS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.product(id ?? ""),
    queryFn: () => catalogApi.getProduct(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useProductReviews(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.productReviews(id ?? ""),
    queryFn: () => catalogApi.getProductReviews(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useProductProfile(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.productProfile(id ?? ""),
    queryFn: () => catalogApi.getProductProfile(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useRatingDistribution(id: string | null) {
  return useQuery({
    queryKey: queryKeys.catalog.ratingDistribution(id ?? ""),
    queryFn: () => catalogApi.getRatingDistribution(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

const QUESTIONS_PAGE_SIZE = 8;

export function useProductQuestions(id: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.catalog.productQuestions(id ?? ""),
    queryFn: ({ pageParam }) =>
      catalogApi.getProductQuestions(id!, { page: pageParam, limit: QUESTIONS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useCreateProductQuestion(productId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductQuestionPayload) =>
      catalogApi.createProductQuestion(productId!, payload),
    onSuccess: async () => {
      if (!productId) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.productQuestions(productId),
      });
    },
  });
}

export function useCreateProductReview(productId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductReviewPayload) =>
      catalogApi.createProductReview(productId!, payload),
    onSuccess: async () => {
      if (!productId) return;
      // Refresh the review list, the recomputed distribution, and the product
      // header (denormalized rating/reviews bump in the same backend tx).
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.productReviews(productId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.catalog.ratingDistribution(productId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.product(productId) }),
      ]);
    },
  });
}

export interface CatalogHelpers {
  products: Product[];
  categories: ReturnType<typeof useCategories>["data"];
  sellers: Record<string, Seller>;
  categoryAttributes: Record<string, CategoryAttributeField[]>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  byId: (id: string) => Product | undefined;
  sellerOf: (product: Product) => Seller | undefined;
  inCat: (categoryId: string) => Product[];
  videoProducts: () => Product[];
  flashProducts: () => Product[];
}

export function useCatalog(): CatalogHelpers {
  const productsQuery = useAllProducts();
  const categoriesQuery = useCategories();
  const sellersQuery = useSellers();

  const products = productsQuery.data?.items ?? [];
  const sellersList = sellersQuery.data ?? [];
  const sellers = Object.fromEntries(sellersList.map((s) => [s.id, s]));
  // The metadata field schema now travels on each category.
  const categoryAttributes = Object.fromEntries(
    (categoriesQuery.data ?? []).map((c) => [c.id, c.fields ?? []]),
  );

  const byId = (id: string) => products.find((p) => p.id === id);
  const sellerOf = (product: Product) => {
    const key = product.seller ?? (product as Product & { sellerId?: string }).sellerId;
    if (!key) return undefined;
    return sellers[key] ?? sellersList.find((s) => s.id === key);
  };
  const inCat = (categoryId: string) => products.filter((p) => p.cat === categoryId);
  const videoProducts = () => products.filter((p) => p.hasVideo);
  const flashProducts = () => products.filter((p) => p.original);

  const isLoading = productsQuery.isLoading || categoriesQuery.isLoading || sellersQuery.isLoading;

  const isError = productsQuery.isError || categoriesQuery.isError || sellersQuery.isError;

  const error = (productsQuery.error ??
    categoriesQuery.error ??
    sellersQuery.error) as Error | null;

  return {
    products,
    categories: categoriesQuery.data,
    sellers,
    categoryAttributes,
    isLoading,
    isError,
    error,
    byId,
    sellerOf,
    inCat,
    videoProducts,
    flashProducts,
  };
}
