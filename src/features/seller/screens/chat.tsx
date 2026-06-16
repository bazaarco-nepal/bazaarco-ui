"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Spinner, EmptyState, TINTS, ApiState } from "@/components/ui";
import { SellerIcon } from "../_shared/icons";
import { useChatInbox, useChatMessages, useInvalidateChat } from "@/hooks/use-chat";
import {
  connectChatSocket,
  disconnectChatSocket,
  emitTypingStart,
  emitTypingStop,
  joinConversation,
  leaveConversation,
  sendChatMessage,
} from "@/lib/chat-socket";
import { chatApi, type ChatMessage, type ChatThread } from "@/services/api/chat";
import { useBz, BuyerAvatar } from "@/components/common";
import { SellerHelpBar } from "../_shared/components";
import { useIsNarrow } from "../_shared/hooks";

export function SellerChat({ buyerMode = false }: { buyerMode?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useBz();
  const isMobile = useIsNarrow();
  const { data: inbox, isLoading, isError, error } = useChatInbox();
  const { invalidateInbox, invalidateMessages } = useInvalidateChat();
  const chatThreads = useMemo(() => inbox?.threads ?? [], [inbox?.threads]);
  const [active, setActive] = useState<ChatThread | null>(null);
  const [mobileInThread, setMobileInThread] = useState(false);
  // True while a chat opened from a product page is being created/fetched, so the
  // buyer sees a clear "opening chat" state instead of a blank panel or the
  // "no conversations yet" empty state during the 4–5s round-trip. Seeded from
  // sessionStorage so the loading screen shows on the very first render.
  const [openingChat, setOpeningChat] = useState(
    () =>
      buyerMode &&
      typeof sessionStorage !== "undefined" &&
      Boolean(sessionStorage.getItem("bz_open_chat_seller")),
  );
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sending, setSending] = useState(false);
  // Composer focus is restored after each send so the keyboard stays up on mobile.
  const inputRef = useRef<HTMLInputElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: msgPage,
    isLoading: msgsLoading,
    isError: msgsError,
    error: msgsLoadError,
    refetch: refetchMessages,
  } = useChatMessages(active?.id ?? null);

  useEffect(() => {
    // Don't auto-pick the first thread while a specific chat is being opened —
    // it would briefly show the wrong conversation before the new one resolves.
    if (isMobile || !chatThreads.length || active || openingChat) return;
    setActive(chatThreads[0] ?? null);
  }, [chatThreads, active, isMobile, openingChat]);

  useEffect(() => {
    if (!buyerMode || typeof sessionStorage === "undefined") return;
    const sellerId = sessionStorage.getItem("bz_open_chat_seller");
    if (!sellerId) return;
    sessionStorage.removeItem("bz_open_chat_seller");
    setOpeningChat(true);
    void chatApi
      .createConversation(sellerId)
      .then((thread) => {
        setActive(thread);
        setMobileInThread(true);
        void invalidateInbox();
      })
      .catch((e) => {
        toast(e instanceof Error ? e.message : "Could not open chat");
      })
      .finally(() => {
        setOpeningChat(false);
      });
  }, [buyerMode, invalidateInbox, toast]);

  useEffect(() => {
    if (msgPage?.messages) setMessages(msgPage.messages);
  }, [msgPage]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev.map((m) => (m.id === message.id ? message : m));
      }
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    connectChatSocket();
    return () => {
      disconnectChatSocket();
    };
  }, []);

  useEffect(() => {
    if (!active?.id) return;
    const socket = connectChatSocket();
    joinConversation(active.id);

    const onNew = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId !== active.id) return;
      if (payload.message.from === "me") return;
      appendMessage(payload.message);
      void invalidateInbox();
    };

    const onStatus = (payload: {
      conversationId: string;
      messageId: string;
      deliveredAt?: string;
      readAt?: string;
    }) => {
      if (payload.conversationId !== active.id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== payload.messageId || m.from !== "me") return m;
          if (payload.readAt) return { ...m, status: "read" };
          if (payload.deliveredAt) return { ...m, status: "delivered" };
          return m;
        }),
      );
    };

    const onTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== active.id) return;
      if (payload.userId === active.peerUserId) setPeerTyping(payload.isTyping);
    };

    const onInbox = () => {
      void invalidateInbox();
    };

    const onPresence = (payload: { userId: string; isOnline: boolean; lastSeenAt: string }) => {
      if (payload.userId !== active.peerUserId) return;
      setActive((cur) =>
        cur
          ? {
              ...cur,
              isOnline: payload.isOnline,
              lastSeenLabel: payload.isOnline
                ? "Online"
                : `Last seen ${new Date(payload.lastSeenAt).toLocaleTimeString()}`,
            }
          : cur,
      );
    };

    socket.on("message_new", onNew);
    socket.on("message_status", onStatus);
    socket.on("typing", onTyping);
    socket.on("inbox_updated", onInbox);
    socket.on("presence_broadcast", onPresence);

    return () => {
      leaveConversation(active.id);
      socket.off("message_new", onNew);
      socket.off("message_status", onStatus);
      socket.off("typing", onTyping);
      socket.off("inbox_updated", onInbox);
      socket.off("presence_broadcast", onPresence);
      setPeerTyping(false);
    };
  }, [active?.id, active?.peerUserId, appendMessage, invalidateInbox]);

  const notifyTyping = useCallback(() => {
    if (!active?.id) return;
    emitTypingStart(active.id);
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      emitTypingStop(active.id);
    }, 1500);
  }, [active?.id]);

  const send = async (text: string) => {
    if (!active?.id) {
      toast("Select a conversation first");
      return;
    }
    if (sending) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const clientMessageId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const optimistic: ChatMessage = {
      id: clientMessageId,
      from: "me",
      text: trimmed,
      t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messageType: "text",
      status: "sent",
      createdAt: new Date().toISOString(),
      senderUserId: "",
    };

    appendMessage(optimistic);
    setMsg("");
    emitTypingStop(active.id);
    setSending(true);

    try {
      const sent = await sendChatMessage(active.id, {
        body: trimmed,
        clientMessageId,
      });
      setMessages((prev) => {
        const withoutSocketDup = prev.filter((m) => m.id !== sent.id);
        return withoutSocketDup.map((m) => (m.id === clientMessageId ? sent : m));
      });
      void invalidateInbox();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== clientMessageId));
      toast(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  // Opening a chat from a product page: show a clear preparing state while the
  // conversation is created/fetched, rather than a blank panel or the empty
  // "no conversations yet" screen. Takes precedence over the inbox states below.
  if (openingChat && !active) {
    return (
      <div className="bz-chat-page">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            minHeight: "50vh",
            textAlign: "center",
          }}
        >
          <Spinner />
          <div>
            <div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: "1rem" }}>
              Opening chat…
            </div>
            <div style={{ fontSize: ".875rem", color: "var(--ink-500)", marginTop: 4 }}>
              Preparing your conversation with the seller.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || isError) {
    return (
      <ApiState isLoading={isLoading} isError={isError} error={error}>
        <div />
      </ApiState>
    );
  }

  if (!chatThreads.length && !active) {
    return (
      <div className="bz-chat-page">
        {!buyerMode ? <SellerHelpBar /> : null}
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
            fontWeight: 600,
            color: "var(--ink-900)",
          }}
        >
          {buyerMode ? "Messages" : "Messages"}
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {buyerMode
            ? "Chat directly with sellers about products and orders."
            : "Reply fast. Buyers who wait > 1hr usually leave."}
        </p>
        <EmptyState
          icon={buyerMode ? undefined : "message"}
          title="No conversations yet"
          message="When buyers message you, chats will appear here."
        />
      </div>
    );
  }

  const showMobileThread = isMobile && mobileInThread && active;

  if (!active && !isMobile) {
    return (
      <ApiState isLoading>
        <div />
      </ApiState>
    );
  }

  return (
    <div className="bz-chat-page">
      {!buyerMode ? <SellerHelpBar /> : null}
      <div
        className="bz-chat-page__head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--ink-900)" }}>
            {buyerMode ? t("seller.chat.titleBuyer") : t("seller.chat.title")}
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
            {buyerMode ? t("seller.chat.subtitleBuyer") : t("seller.chat.subtitleSeller")}
          </p>
        </div>
      </div>

      <div className={`bz-chat-shell${showMobileThread ? " bz-chat-shell--in-thread" : ""}`}>
        {/* Threads list */}
        <aside className="bz-chat-shell__threads">
          {chatThreads.map((t) => {
            const sel = active?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActive(t);
                  setMessages([]);
                  setPeerTyping(false);
                  if (isMobile) setMobileInThread(true);
                }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  background: sel ? "var(--tint-blue-50)" : "#fff",
                  border: "none",
                  borderBottom: "1px solid var(--line-200)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <BuyerAvatar
                  src={t.avatarUrl}
                  name={t.buyer}
                  size={40}
                  fontSize=".875rem"
                  style={{
                    background: TINTS[t.tone as keyof typeof TINTS][0],
                    color: TINTS[t.tone as keyof typeof TINTS][2],
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: ".875rem",
                        color: "var(--ink-900)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.buyer}
                    </div>
                    <div style={{ fontSize: ".7rem", color: "var(--ink-400)" }}>{t.time}</div>
                  </div>
                  <div
                    style={{
                      fontSize: ".75rem",
                      color: "var(--ink-500)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.last}
                  </div>
                </div>
                {t.unread > 0 && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      background: "var(--danger)",
                      color: "#fff",
                      fontSize: ".68rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {t.unread}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Conversation */}
        {active ? (
          <div className="bz-chat-shell__panel">
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line-200)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setMobileInThread(false)}
                  aria-label="Back to conversations"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid var(--line-200)",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <SellerIcon name="arrowLeft" size={18} color="var(--ink-700)" />
                </button>
              ) : null}
              <BuyerAvatar
                src={active.avatarUrl}
                name={active.buyer}
                size={36}
                fontSize=".875rem"
                style={{
                  background: TINTS[active.tone as keyof typeof TINTS][0],
                  color: TINTS[active.tone as keyof typeof TINTS][2],
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>{active.buyer}</div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  {peerTyping
                    ? `${active.buyer} is typing...`
                    : `${active.city} · ${active.lastSeenLabel}`}
                </div>
              </div>
            </div>

            <div className="bz-chat-shell__messages">
              {/* Keeps buyers and sellers on-platform: off-app deals lose
                  BazaarCo's protection (and our commission). Scrolls with the
                  thread so it informs without blocking the conversation. */}
              <div
                style={{
                  flexShrink: 0,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  padding: "8px 10px",
                  background: "rgba(247, 127, 0, 0.08)",
                  border: "1px solid rgba(247, 127, 0, 0.22)",
                  borderRadius: 10,
                  fontSize: ".75rem",
                  lineHeight: 1.4,
                  color: "var(--ink-700)",
                }}
              >
                <SellerIcon
                  name="shieldCheck"
                  size={16}
                  color="var(--saffron)"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <span>
                  Keep chats and payments on BazaarCo. Orders settled outside the app aren&apos;t
                  protected for buyers or sellers.
                </span>
              </div>
              {msgsLoading && !messages.length ? (
                <div style={{ textAlign: "center", color: "var(--ink-400)", fontSize: ".8125rem" }}>
                  Loading messages...
                </div>
              ) : null}
              {msgsError && !messages.length ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--ink-500)",
                    fontSize: ".8125rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    {msgsLoadError instanceof Error
                      ? msgsLoadError.message
                      : "Could not load messages"}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => void refetchMessages()}>
                    Retry
                  </Button>
                </div>
              ) : null}
              {!msgsLoading && !msgsError && !messages.length ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--ink-400)",
                    fontSize: ".8125rem",
                  }}
                >
                  No messages yet. Say hello.
                </div>
              ) : null}
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.from === "me" ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      background: m.from === "me" ? "var(--blue)" : "#fff",
                      color: m.from === "me" ? "#fff" : "var(--ink-900)",
                      borderRadius: m.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      fontSize: ".875rem",
                      border: m.from === "me" ? "none" : "1px solid var(--line-200)",
                    }}
                  >
                    {m.text}
                  </div>
                  <div
                    style={{
                      fontSize: ".65rem",
                      color: "var(--ink-400)",
                      marginTop: 2,
                      textAlign: m.from === "me" ? "right" : "left",
                      display: "flex",
                      gap: 6,
                      justifyContent: m.from === "me" ? "flex-end" : "flex-start",
                    }}
                  >
                    <span>{m.t}</span>
                    {m.from === "me" && m.status ? (
                      <span>
                        {m.status === "read"
                          ? "Read"
                          : m.status === "delivered"
                            ? "Delivered"
                            : "Sent"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="bz-chat-shell__composer">
              <input
                ref={inputRef}
                type="text"
                className="bz-chat-shell__composer-input"
                value={msg}
                onChange={(e) => {
                  setMsg(e.target.value);
                  notifyTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(msg);
                  }
                }}
                placeholder="Type a message"
                disabled={sending}
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => void send(msg)}
                disabled={!msg.trim() || sending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: msg.trim() && !sending ? "var(--blue)" : "var(--line-200)",
                  color: "#fff",
                  border: "none",
                  cursor: msg.trim() && !sending ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SellerIcon name="arrowRight" size={20} color="#fff" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
