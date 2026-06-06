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

export const videosApi = {
  getFeed(tab: VideoFeedTab = "foryou"): Promise<VideoFeedResponse> {
    return getData<VideoFeedResponse>("/videos/feed", { tab });
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
