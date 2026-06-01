import { apiClient, getData } from "./http";
import type { ApiSuccessResponse } from "./types";

export interface ChatQuickReply {
  en: string;
  ne: string;
}

export interface ChatThread {
  id: string;
  buyer: string;
  avatar: string;
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
  quickReplies: ChatQuickReply[];
  threads: ChatThread[];
}

export interface ChatMessageAttachment {
  url: string;
  thumbnailUrl?: string | null;
  mediaType: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  t: string;
  messageType: string;
  attachment?: ChatMessageAttachment;
  status?: "sent" | "delivered" | "read";
  createdAt: string;
  senderUserId: string;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface SendChatMessagePayload {
  body?: string;
  clientMessageId?: string;
  attachment?: {
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    mediaType: "image" | "video";
    sizeBytes?: number;
    width?: number;
    height?: number;
    durationSec?: number;
    publicId?: string;
  };
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

  async uploadImage(file: File): Promise<{
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    bytes: number;
    format: string;
  }> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<
      ApiSuccessResponse<{
        url: string;
        publicId: string;
        width?: number;
        height?: number;
        bytes: number;
        format: string;
      }>
    >("/chat/media/image", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data.data;
  },

  async uploadVideo(file: File): Promise<{
    url: string;
    publicId: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
    format: string;
  }> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<
      ApiSuccessResponse<{
        url: string;
        publicId: string;
        thumbnailUrl?: string;
        width?: number;
        height?: number;
        duration?: number;
        bytes: number;
        format: string;
      }>
    >("/chat/media/video", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data.data;
  },
};
