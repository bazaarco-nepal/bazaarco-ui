"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaApi } from "@/shared/api/media";
import { uploadSellerVideo } from "@/shared/api/cloudinary-upload";
import { queryKeys } from "@/shared/api/query-keys";

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) =>
      mediaApi.uploadImage(file, onProgress),
  });
}

export function useUploadVideo() {
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) =>
      uploadSellerVideo(file, onProgress),
  });
}

export function useCreateSellerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mediaApi.createSellerVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.videos });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
    },
  });
}

export function useDeleteSellerVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => mediaApi.deleteSellerVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.videos });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
    },
  });
}
