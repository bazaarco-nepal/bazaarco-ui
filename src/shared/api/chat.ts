import { apiClient, getData } from "./http";
import type { ApiSuccessResponse } from "./types";

export interface ChatThread {
  id: string;
  buyer: string;
  avatar: string;
  avatarUrl: string | null;
  city: string;
  time: string;
  last: string;
  unread: number;
  tone: string;
  peerUserId: string;
  isOnline: boolean;
  lastSeenLabel: string;
}

export interface ChatInbox {
  threads: ChatThread[];
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  t: string;
  messageType: string;
  status?: "sent" | "delivered" | "read";
  createdAt: string;
  senderUserId: string;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface SendChatMessagePayload {
  body: string;
  clientMessageId?: string;
}

export const chatApi = {
  getInbox(): Promise<ChatInbox> {
    return getData<ChatInbox>("/chat/inbox");
  },

  createConversation(sellerId: string): Promise<ChatThread> {
    return apiClient
      .post<ApiSuccessResponse<ChatThread>>("/chat/conversations", { sellerId })
      .then((r) => r.data.data);
  },

  getMessages(
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<ChatMessagesPage> {
    return getData<ChatMessagesPage>(`/chat/conversations/${conversationId}/messages`, params);
  },

  sendMessage(conversationId: string, payload: SendChatMessagePayload): Promise<ChatMessage> {
    return apiClient
      .post<
        ApiSuccessResponse<ChatMessage>
      >(`/chat/conversations/${conversationId}/messages`, payload)
      .then((r) => r.data.data);
  },

  markRead(
    conversationId: string,
    messageIds?: string[],
  ): Promise<{ messageIds: string[]; readAt: string }> {
    return apiClient
      .post<
        ApiSuccessResponse<{ messageIds: string[]; readAt: string }>
      >(`/chat/conversations/${conversationId}/read`, { messageIds })
      .then((r) => r.data.data);
  },
};
