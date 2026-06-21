import type { VideoFeedResponse, VideoFeedTab } from "@/types/video";
import { deleteData, getData, postData } from "@/shared/api/http";

export interface VideoLikeResult {
  videoId: string;
  liked: boolean;
}

export interface VideoViewResult {
  videoId: string;
  viewed: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideoItem(raw: any) {
  return {
    ...raw,
    price: raw.price,
    original: raw.original ?? null,
    sellerId: raw.sellerId ?? raw.storeId ?? "",
    img: raw.img ?? raw.coverImageUrl ?? null,
    reviews: raw.reviews ?? raw.reviewsCount ?? 0,
    icon: raw.icon ?? "box",
    tint: raw.tint ?? "blue",
    // Core API returns the merchant under `store`; the storefront models it as `seller`.
    seller: raw.store,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideoFeedResponse(raw: any): VideoFeedResponse {
  return { ...raw, items: (raw.items ?? []).map(mapVideoItem) };
}

export const videosApi = {
  async getFeed(tab: VideoFeedTab = "foryou"): Promise<VideoFeedResponse> {
    const raw = await getData<VideoFeedResponse>("/videos/feed", { tab });
    return mapVideoFeedResponse(raw);
  },
  like(videoId: string): Promise<VideoLikeResult> {
    return postData<VideoLikeResult>(`/videos/${videoId}/like`);
  },
  unlike(videoId: string): Promise<VideoLikeResult> {
    return deleteData<VideoLikeResult>(`/videos/${videoId}/like`);
  },
  recordView(videoId: string): Promise<VideoViewResult> {
    return postData<VideoViewResult>(`/videos/${videoId}/view`);
  },
};
