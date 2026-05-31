import type { VideoFeedResponse, VideoFeedTab } from "@/types/video";
import { getData } from "./http";

export const videosApi = {
  getFeed(tab: VideoFeedTab = "foryou"): Promise<VideoFeedResponse> {
    return getData<VideoFeedResponse>("/videos/feed", { tab });
  },
};
