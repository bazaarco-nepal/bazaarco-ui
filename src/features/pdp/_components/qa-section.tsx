"use client";

import { useState } from "react";
import { Button, Chip, SectionHead } from "@/components/ui";
import { useBz } from "@/components/common";
import { useProductQuestions } from "@/hooks/use-catalog";
import type { ProductQuestion } from "@/types";
import { AskQuestionModal } from "./ask-question-modal";

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
  const { authed, promptLogin } = useBz();
  const query = useProductQuestions(productId);
  const [askOpen, setAskOpen] = useState(false);

  const questions: ProductQuestion[] = (query.data?.pages ?? []).flatMap((p) => p.items);
  const isLoading = query.isLoading;

  const onAsk = () => {
    if (!authed) {
      promptLogin("Please sign in to ask a question.");
      return;
    }
    setAskOpen(true);
  };

  return (
    <div>
      <SectionHead title="Questions & answers" />
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

        <div style={{ marginTop: 18 }}>
          <Button variant="secondary" full onClick={onAsk}>
            Ask a question
          </Button>
        </div>
      </div>

      {askOpen && <AskQuestionModal productId={productId} onClose={() => setAskOpen(false)} />}
    </div>
  );
}
