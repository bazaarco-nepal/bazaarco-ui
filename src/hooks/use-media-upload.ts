"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaApi } from "@/services/api/media";
import { queryKeys } from "@/services/api/query-keys";

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) =>
      mediaApi.uploadImage(file, onProgress),
  });
}

export function useUploadVideo() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) =>
      mediaApi.uploadVideo(file, onProgress),
  });
}

export function useCreateSellerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mediaApi.createSellerVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.videos });
    },
  });
}

export function useUpdateSellerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      videoId,
      ...payload
    }: {
      videoId: string;
      title?: string;
      product?: string;
      status?: "draft" | "published";
    }) => mediaApi.updateSellerVideo(videoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.videos });
    },
  });
}

export function useDeleteSellerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => mediaApi.deleteSellerVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.videos });
    },
  });
}

export function useUpdateProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      media,
    }: {
      productId: string;
      media: Parameters<typeof mediaApi.updateProductMedia>[1];
    }) => mediaApi.updateProductMedia(productId, media),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.product(variables.productId),
      });
    },
  });
}
