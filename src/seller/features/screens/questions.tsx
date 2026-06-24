"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { Button, ChipGroup, ApiState } from "@/components/ui";
import { BuyerAvatar, useBz } from "@/components/common";
import { toast } from "@/shared/lib/toast";
import { useSellerQuestions, useAnswerProductQuestion } from "@/seller/hooks/use-seller";
import type { SellerProductQuestion } from "@/seller/api/seller";
import {
  SellerHelpBar,
  SellerPageHeader,
  SellerEmptyState,
  SellerPage,
  MetricGrid,
  Metric,
} from "../_shared/components";

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

/** Groups a flat, newest-first list into per-product buckets, order preserved. */
function groupByProduct(items: SellerProductQuestion[]) {
  const groups = new Map<
    string,
    { product: SellerProductQuestion["product"]; rows: SellerProductQuestion[] }
  >();
  for (const q of items) {
    const g = groups.get(q.product.id);
    if (g) g.rows.push(q);
    else groups.set(q.product.id, { product: q.product, rows: [q] });
  }
  // Pending first within each product so the seller's queue is obvious.
  for (const g of groups.values()) {
    g.rows.sort((a, b) => (a.status === b.status ? 0 : a.status === "pending" ? -1 : 1));
  }
  return [...groups.values()];
}

function AnswerComposer({ question }: { question: SellerProductQuestion }) {
  const answer = useAnswerProductQuestion();
  const [text, setText] = useState("");
  const canSubmit = text.trim().length > 0 && !answer.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await answer.mutateAsync({
        productId: question.product.id,
        questionId: question.id,
        text: text.trim(),
      });
      toast.success("Answer posted — the buyer can see it now.");
      setText("");
    } catch {
      toast.error("Could not post your answer. Try again.");
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Write a clear, helpful answer…"
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <Button variant="primary" size="sm" disabled={!canSubmit} onClick={() => void submit()}>
          {answer.isPending ? "Posting…" : "Post answer"}
        </Button>
      </div>
    </div>
  );
}

function QuestionRow({ q }: { q: SellerProductQuestion }) {
  return (
    <div style={{ padding: "14px 0", borderTop: "1px solid var(--line-100)" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <BuyerAvatar
          src={q.askerAvatarUrl}
          name={q.askerName}
          size={32}
          fontSize=".8125rem"
          style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{q.text}</div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>
            {q.askerName} · {timeAgo(q.createdAt)}
          </div>
        </div>
      </div>

      {q.answer ? (
        <div
          style={{
            marginTop: 8,
            marginLeft: 42,
            padding: 10,
            background: "var(--line-100)",
            borderRadius: "var(--r-md)",
            borderLeft: "3px solid var(--success)",
          }}
        >
          <div
            style={{ fontSize: ".7rem", color: "var(--success)", fontWeight: 600, marginBottom: 2 }}
          >
            Your answer
            {q.answer.answeredAt ? ` · ${timeAgo(q.answer.answeredAt)}` : ""}
          </div>
          <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>{q.answer.text}</div>
        </div>
      ) : (
        <div style={{ marginLeft: 42 }}>
          <AnswerComposer question={q} />
        </div>
      )}
    </div>
  );
}

export function SellerQuestions() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const productFilter = useSearchParams().get("product");
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("all");

  const status = filter === "all" ? undefined : filter;
  const list = useSellerQuestions({ status, product: productFilter });
  // Counts share query keys with the nav badge when no product filter — deduped.
  const pending = useSellerQuestions({ status: "pending", product: productFilter });
  const answered = useSellerQuestions({ status: "answered", product: productFilter });

  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const groups = useMemo(() => groupByProduct(items), [items]);

  const pendingCount = pending.data?.pages[0]?.total ?? 0;
  const answeredCount = answered.data?.pages[0]?.total ?? 0;
  const productName = productFilter ? items[0]?.product.name : null;

  return (
    <ApiState isLoading={list.isLoading} isError={list.isError} error={list.error}>
      <SellerPage>
        <SellerHelpBar />
        <SellerPageHeader
          title={t("seller.questions.title")}
          subtitle={t("seller.questions.subtitle")}
        />

        <div style={{ marginBottom: 18 }}>
          <MetricGrid>
            <Metric label="Total" value={pendingCount + answeredCount} />
            <Metric label="Awaiting answer" value={pendingCount} />
            <Metric label="Answered" value={answeredCount} />
          </MetricGrid>
        </div>

        {productFilter && productName && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>
              Showing questions for <b>{productName}</b>
            </div>
            <Button variant="ghost" size="sm" onClick={() => nav("s-questions")}>
              View all products
            </Button>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <ChipGroup
            options={[
              { value: "all", label: "All" },
              { value: "pending", label: "Needs answer" },
              { value: "answered", label: "Answered" },
            ]}
            value={filter}
            onChange={(v: string) => setFilter(v as "all" | "pending" | "answered")}
          />
        </div>

        {groups.length === 0 ? (
          <SellerEmptyState
            icon="chatHelp"
            title="No questions yet"
            message="When buyers ask about your products, their questions land here for you to answer."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.map((g) => (
              <div
                key={g.product.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--r-md)",
                      overflow: "hidden",
                      background: "var(--line-100)",
                      flexShrink: 0,
                    }}
                  >
                    {g.product.image && (
                      <img
                        src={g.product.image}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--ink-900)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.product.name}
                    </div>
                    <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
                      {g.rows.filter((r) => r.status === "pending").length} awaiting ·{" "}
                      {g.rows.length} total
                    </div>
                  </div>
                </div>
                {g.rows.map((q) => (
                  <QuestionRow key={q.id} q={q} />
                ))}
              </div>
            ))}

            {list.hasNextPage && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={list.isFetchingNextPage}
                  onClick={() => void list.fetchNextPage()}
                >
                  {list.isFetchingNextPage ? "Loading…" : "Show more questions"}
                </Button>
              </div>
            )}
          </div>
        )}
      </SellerPage>
    </ApiState>
  );
}
