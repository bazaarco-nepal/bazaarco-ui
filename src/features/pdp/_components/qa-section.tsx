"use client";

import { useState } from "react";
import { Button, Chip } from "@/components/ui";
import { useBz } from "@/components/common";
import { useProductQuestions, useCreateProductQuestion } from "@/hooks/use-catalog";
import type { ProductQuestion } from "@/types";

function QuestionComposer({ productId, onDone }: { productId: string; onDone: () => void }) {
  const { toast, authed, promptLogin } = useBz();
  const createQuestion = useCreateProductQuestion(productId);
  const [text, setText] = useState("");
  const canSubmit = text.trim().length > 0 && !createQuestion.isPending;

  const submit = async () => {
    if (!authed) {
      promptLogin("Please sign in to ask a question.");
      return;
    }
    if (!canSubmit) return;
    try {
      await createQuestion.mutateAsync({ text: text.trim() });
      toast("Question posted — the seller will answer soon.");
      setText("");
      onDone();
    } catch {
      toast("Could not post question. Try again.");
    }
  };

  return (
    <div
      style={{
        marginBottom: 14,
        padding: 14,
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-md)",
        background: "#fff",
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Ask about size, materials, delivery…"
        style={{
          width: "100%",
          resize: "vertical",
          padding: "10px 12px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--line-200)",
          fontFamily: "var(--font-sans)",
          fontSize: ".875rem",
          color: "var(--ink-900)",
        }}
      />
      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          type="button"
          onClick={onDone}
          className="bz-link-hover"
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-400)",
            fontSize: ".8125rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          className="bz-link-hover"
          style={{
            background: "none",
            border: "none",
            color: canSubmit ? "var(--blue)" : "var(--ink-300)",
            fontSize: ".8125rem",
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
            padding: 0,
          }}
        >
          {createQuestion.isPending ? "Posting…" : "Post question"}
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function Bubble({ kind, children }: { kind: "Q" | "A"; children: React.ReactNode }) {
  const isQ = kind === "Q";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: isQ ? "var(--tint-blue-50)" : "rgba(22,163,74,.12)",
          color: isQ ? "var(--blue)" : "var(--success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {kind}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function QuestionRow({ q, isLast }: { q: ProductQuestion; isLast: boolean }) {
  return (
    <div
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--line-200)",
        padding: "16px 0",
      }}
    >
      <Bubble kind="Q">
        <div style={{ fontWeight: 700 }}>{q.text}</div>
        <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 4 }}>
          {q.askerName} · {timeAgo(q.createdAt)}
        </div>
      </Bubble>
      <div style={{ marginTop: 10 }}>
        {q.answer ? (
          <Bubble kind="A">
            <div style={{ color: "var(--ink-700)", fontSize: ".9375rem" }}>{q.answer.text}</div>
            <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 4 }}>
              {q.answer.answeredBy ?? "Seller"}
              {q.answer.answeredAt ? ` · ${timeAgo(q.answer.answeredAt)}` : ""}
            </div>
          </Bubble>
        ) : (
          <div style={{ paddingLeft: 38 }}>
            <Chip tone="neutral">Awaiting answer from seller</Chip>
          </div>
        )}
      </div>
    </div>
  );
}

export function QASection({ productId }: { productId: string }) {
  const query = useProductQuestions(productId);
  const [composerOpen, setComposerOpen] = useState(false);

  const questions: ProductQuestion[] = (query.data?.pages ?? []).flatMap((p) => p.items);
  const isLoading = query.isLoading;

  return (
    <div>
      {!composerOpen && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="bz-link-hover"
            style={{
              background: "none",
              border: "none",
              color: "var(--blue)",
              fontSize: ".8125rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              whiteSpace: "nowrap",
            }}
          >
            Ask a question
          </button>
        </div>
      )}
      {composerOpen && (
        <QuestionComposer productId={productId} onDone={() => setComposerOpen(false)} />
      )}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          padding: 20,
        }}
      >
        {isLoading ? (
          <div style={{ color: "var(--ink-400)", fontSize: ".875rem", padding: "8px 0" }}>
            Loading questions…
          </div>
        ) : questions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--ink-400)",
              fontSize: ".9375rem",
              padding: "20px 0 8px",
            }}
          >
            No questions yet — be the first to ask.
          </div>
        ) : (
          <div style={{ marginTop: -16 }}>
            {questions.map((q, i) => (
              <QuestionRow key={q.id} q={q} isLast={i === questions.length - 1} />
            ))}
          </div>
        )}

        {query.hasNextPage && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <Button
              variant="ghost"
              size="sm"
              iconRight="chevronDown"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? "Loading…" : "Show more questions"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
