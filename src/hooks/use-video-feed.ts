"use client";

import { useQuery } from "@tanstack/react-query";

import { videosApi } from "@/services/api/videos";
import { queryKeys } from "@/services/api/query-keys";
import type { VideoFeedTab } from "@/types/video";

const STALE_TIME = 2 * 60 * 1000;

export function useVideoFeed(tab: VideoFeedTab = "foryou") {
  return useQuery({
    queryKey: queryKeys.videos.feed(tab),
    queryFn: () => videosApi.getFeed(tab),
    staleTime: STALE_TIME,
  });
}
