"use client";

import { useMutation } from "@tanstack/react-query";

import { videosApi } from "@/buyer/api/videos";

export function useVideoLike() {
  return useMutation({
    mutationFn: ({ videoId, like }: { videoId: string; like: boolean }) =>
      like ? videosApi.like(videoId) : videosApi.unlike(videoId),
  });
}
