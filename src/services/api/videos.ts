import type { VideoFeedResponse, VideoFeedTab } from "@/types/video";
import { deleteData, getData, postData } from "./http";

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
  const minorToRupees = (v: unknown) => (typeof v === "number" ? v / 100 : 0);
  return {
    ...raw,
    price: typeof raw.price === "number" ? raw.price : minorToRupees(raw.priceMinor),
    original:
      typeof raw.original === "number"
        ? raw.original
        : raw.originalMinor != null
          ? minorToRupees(raw.originalMinor)
          : null,
    sellerId: raw.sellerId ?? raw.storeId ?? "",
    img: raw.img ?? raw.coverImageUrl ?? null,
    reviews: raw.reviews ?? raw.reviewsCount ?? 0,
    icon: raw.icon ?? "box",
    tint: raw.tint ?? "blue",
    seller: raw.seller
      ? {
          ...raw.seller,
          city: raw.seller.city ?? "",
          reviews: raw.seller.reviews ?? raw.seller.reviewsCount ?? 0,
          tint: raw.seller.tint ?? "blue",
        }
      : undefined,
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
