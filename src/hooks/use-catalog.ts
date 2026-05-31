"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogApi, type ProductListParams } from "@/services/api/catalog";
import { queryKeys } from "@/services/api/query-keys";
import type { CategoryAttributeField, Product, Seller } from "@/types";

const STALE_TIME = 5 * 60 * 1000;

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => catalogApi.getCategories(),
    staleTime: STALE_TIME,
  });
}

export function useAttrCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.attrCategories,
    queryFn: () => catalogApi.getAttrCategories(),
    staleTime: STALE_TIME,
  });
}

export function useCategoryAttributes() {
  return useQuery({
    queryKey: queryKeys.catalog.categoryAttributes,
    queryFn: () => catalogApi.getCategoryAttributesMap(),
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
  const attributesQuery = useCategoryAttributes();

  const products = productsQuery.data?.items ?? [];
  const sellersList = sellersQuery.data ?? [];
  const sellers = Object.fromEntries(sellersList.map((s) => [s.id, s]));

  const byId = (id: string) => products.find((p) => p.id === id);
  const sellerOf = (product: Product) => sellers[product.seller];
  const inCat = (categoryId: string) => products.filter((p) => p.cat === categoryId);
  const videoProducts = () => products.filter((p) => p.hasVideo);
  const flashProducts = () => products.filter((p) => p.original);

  const isLoading =
    productsQuery.isLoading ||
    categoriesQuery.isLoading ||
    sellersQuery.isLoading ||
    attributesQuery.isLoading;

  const isError =
    productsQuery.isError ||
    categoriesQuery.isError ||
    sellersQuery.isError ||
    attributesQuery.isError;

  const error =
    (productsQuery.error ??
      categoriesQuery.error ??
      sellersQuery.error ??
      attributesQuery.error) as Error | null;

  return {
    products,
    categories: categoriesQuery.data,
    sellers,
    categoryAttributes: attributesQuery.data ?? {},
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
