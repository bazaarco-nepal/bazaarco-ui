import { io, type Socket } from "socket.io-client";

import type { ChatMessage, SendChatMessagePayload } from "@/services/api/chat";

function wsBaseUrl(): string {
  if (
    typeof process.env.NEXT_PUBLIC_WS_BASE_URL === "string" &&
    process.env.NEXT_PUBLIC_WS_BASE_URL
  ) {
    return process.env.NEXT_PUBLIC_WS_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }
  return "";
}

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    const base = wsBaseUrl();
    socket = io(base, {
      withCredentials: true,
      path: "/socket.io",
      autoConnect: false,
    });
  }
  return socket;
}

export function connectChatSocket(): Socket {
  const s = getChatSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectChatSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export function joinConversation(conversationId: string): void {
  connectChatSocket().emit("join_conversation", { conversationId });
}

export function leaveConversation(conversationId: string): void {
  getChatSocket().emit("leave_conversation", { conversationId });
}

export function emitTypingStart(conversationId: string): void {
  connectChatSocket().emit("typing_start", { conversationId });
}

export function emitTypingStop(conversationId: string): void {
  connectChatSocket().emit("typing_stop", { conversationId });
}

export function sendChatMessageSocket(
  conversationId: string,
  payload: SendChatMessagePayload,
): Promise<ChatMessage> {
  return new Promise((resolve, reject) => {
    connectChatSocket().emit(
      "send_message",
      { conversationId, ...payload },
      (ack?: { ok: boolean; message?: ChatMessage; error?: string }) => {
        if (ack?.ok && ack.message) {
          resolve(ack.message);
          return;
        }
        reject(new Error(ack?.error ?? "Failed to send message"));
      },
    );
  });
}
