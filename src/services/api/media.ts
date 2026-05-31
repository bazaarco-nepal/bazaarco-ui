import { apiClient } from "./http";
import type { ApiSuccessResponse } from "./types";

export interface MediaUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  thumbnailUrl?: string;
}

export interface CreateSellerVideoPayload {
  title: string;
  product: string;
  videoUrl: string;
  thumbUrl: string;
  publicId?: string;
  productId?: string;
  tint?: string;
  icon?: string;
}

export interface SellerVideoItem {
  id: string;
  title: string;
  product: string;
  videoUrl: string | null;
  thumb: string;
  views: number;
  likes: number;
  tint: string;
  icon: string;
  productId?: string | null;
}

export const mediaApi = {
  async uploadImage(file: File, onProgress?: (pct: number) => void): Promise<MediaUploadResult> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ApiSuccessResponse<MediaUploadResult>>(
      "/media/upload/image",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      },
    );
    return data.data;
  },

  async uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<MediaUploadResult> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ApiSuccessResponse<MediaUploadResult>>(
      "/media/upload/video",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      },
    );
    return data.data;
  },

  async createSellerVideo(payload: CreateSellerVideoPayload): Promise<SellerVideoItem> {
    const { data } = await apiClient.post<ApiSuccessResponse<SellerVideoItem>>(
      "/seller/videos",
      payload,
    );
    return data.data;
  },

  async updateProductMedia(
    productId: string,
    media: {
      img?: string;
      videoUrl?: string | null;
      videoThumb?: string | null;
      hasVideo?: boolean;
    },
  ) {
    const { data } = await apiClient.patch<ApiSuccessResponse<unknown>>(
      `/catalog/products/${productId}/media`,
      media,
    );
    return data.data;
  },
};
