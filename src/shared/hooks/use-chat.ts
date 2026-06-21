"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/api/chat";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 15_000;

export function useChatInbox() {
  return useQuery({
    queryKey: queryKeys.chat.inbox,
    queryFn: () => chatApi.getInbox(),
    staleTime: STALE_TIME,
    refetchInterval: 60_000,
  });
}

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(conversationId ?? ""),
    queryFn: () => chatApi.getMessages(conversationId!, { limit: 40 }),
    enabled: Boolean(conversationId),
    staleTime: STALE_TIME,
  });
}

export function useInvalidateChat() {
  const qc = useQueryClient();
  return {
    invalidateInbox: () => qc.invalidateQueries({ queryKey: queryKeys.chat.inbox }),
    invalidateMessages: (conversationId: string) =>
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId) }),
  };
}
