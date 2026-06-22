import type { VideoFeedResponse, VideoFeedTab } from "@/types/video";
import { getData, postData } from "@/shared/api/http";

export interface RecordViewPayload {
  eventType: "qualified_view";
  source?: string;
  playbackPercent: number;
  watchMs?: number;
  videoDurationMs?: number;
}

export interface VideoViewResult {
  videoId: string;
  viewed: boolean;
  counted?: boolean;
  reason?: string;
  viewCount?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideoItem(raw: any) {
  return {
    ...raw,
    price: raw.price,
    original: raw.original ?? null,
    allowBargaining: Boolean(raw.allowBargaining),
    outOfStock: Boolean(raw.outOfStock),
    productId: raw.productId ?? raw.id,
    videoId: raw.videoId ?? null,
    sellerId: raw.sellerId ?? raw.storeId ?? "",
    img: raw.img ?? raw.coverImageUrl ?? null,
    reviews: raw.reviews ?? raw.reviewsCount ?? 0,
    icon: raw.icon ?? "box",
    tint: raw.tint ?? "blue",
    // Core API returns the merchant under `store`; the storefront models it as `seller`.
    seller: {
      ...(raw.store ?? {}),
      url: raw.store?.url ?? (raw.store?.id ? `/store/${raw.store.id}` : "/stores"),
    },
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
  recordView(videoId: string, payload: RecordViewPayload): Promise<VideoViewResult> {
    return postData<VideoViewResult>(`/videos/${videoId}/view`, payload);
  },
};
