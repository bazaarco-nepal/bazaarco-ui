import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/lib/auth-token";
import type { ChatMessage, SendChatMessagePayload } from "@/services/api/chat";
import { chatApi } from "@/services/api/chat";

function resolveWsBaseUrl(): string {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (backend) return backend.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") {
      return "http://localhost:3000";
    }
    return window.location.origin;
  }
  return "";
}

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    const base = resolveWsBaseUrl();
    socket = io(base, {
      withCredentials: true,
      path: "/socket.io",
      autoConnect: false,
    });
  }
  return socket;
}

function applySocketAuth(sock: Socket): void {
  const token = getAccessToken();
  sock.auth = token ? { token } : {};
}

function waitForSocketConnection(sock: Socket, timeoutMs = 6000): Promise<void> {
  if (sock.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Chat connection timed out"));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      clearTimeout(timer);
      sock.off("connect", onConnect);
      sock.off("connect_error", onError);
    };

    sock.on("connect", onConnect);
    sock.on("connect_error", onError);
  });
}

export function connectChatSocket(): Socket {
  const s = getChatSocket();
  applySocketAuth(s);
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
    const sock = connectChatSocket();

    const emitSend = () => {
      const timer = setTimeout(() => {
        reject(new Error("Send timed out"));
      }, 10_000);

      sock.emit(
        "send_message",
        { conversationId, ...payload },
        (ack?: { ok: boolean; message?: ChatMessage; error?: string }) => {
          clearTimeout(timer);
          if (ack?.ok && ack.message) {
            resolve(ack.message);
            return;
          }
          reject(new Error(ack?.error ?? "Failed to send message"));
        },
      );
    };

    if (sock.connected) {
      emitSend();
      return;
    }

    void waitForSocketConnection(sock)
      .then(emitSend)
      .catch((err) => reject(err instanceof Error ? err : new Error("Chat not connected")));
  });
}

const SOCKET_SEND_TIMEOUT_MS = 2500;

/**
 * Send via REST for a fast, reliable path. Use socket only when already connected
 * (avoids waiting up to 6s for connection before the HTTP fallback).
 */
export async function sendChatMessage(
  conversationId: string,
  payload: SendChatMessagePayload,
): Promise<ChatMessage> {
  const sock = getChatSocket();
  if (sock.connected) {
    try {
      return await Promise.race([
        sendChatMessageSocket(conversationId, payload),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Socket send timed out")), SOCKET_SEND_TIMEOUT_MS);
        }),
      ]);
    } catch {
      // fall through to REST
    }
  }
  return chatApi.sendMessage(conversationId, payload);
}
