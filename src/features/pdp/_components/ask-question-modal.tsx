"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { useBz } from "@/components/common";
import { useCreateProductQuestion } from "@/hooks/use-catalog";

interface AskQuestionModalProps {
  productId: string;
  onClose: () => void;
}

/** Signed-in buyer asks a question; the seller is notified to answer. */
export function AskQuestionModal({ productId, onClose }: AskQuestionModalProps) {
  const { toast } = useBz();
  const createQuestion = useCreateProductQuestion(productId);
  const [text, setText] = useState("");

  const canSubmit = text.trim().length > 0 && !createQuestion.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await createQuestion.mutateAsync({ text: text.trim() });
      toast("Question posted — the seller will answer soon.");
      onClose();
    } catch {
      toast("Could not post question. Try again.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="bz-modal"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: "var(--r-lg)",
          padding: 24,
          boxShadow: "var(--sh-3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--ink-900)" }}>
            Ask a question
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              marginLeft: "auto",
              width: 32,
              height: 32,
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-200)",
              background: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-500)",
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          Ask the seller anything about this product — sizing, materials, delivery, and more.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Type your question…"
          style={{
            width: "100%",
            resize: "vertical",
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--line-200)",
            fontFamily: "var(--font-sans)",
            fontSize: ".9375rem",
            color: "var(--ink-900)",
            marginBottom: 18,
          }}
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="arrowRight"
            disabled={!canSubmit}
            loading={createQuestion.isPending}
            onClick={() => void submit()}
          >
            Post question
          </Button>
        </div>
      </div>
    </div>
  );
}
