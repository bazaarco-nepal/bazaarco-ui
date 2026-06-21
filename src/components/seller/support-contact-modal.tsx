"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";

export function SupportContactModal({
  open,
  onClose,
  whatsappUrl,
  emailUrl,
  phone,
  email,
}: {
  open: boolean;
  onClose: () => void;
  whatsappUrl: string;
  emailUrl: string;
  phone: string;
  email: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-contact-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 700,
        background: "rgba(11,18,32,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: "100%",
          maxWidth: 380,
          boxShadow: "var(--sh-3)",
        }}
      >
        <h3
          id="support-contact-title"
          style={{
            margin: "0 0 6px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          Contact support
        </h3>
        <p style={{ margin: "0 0 20px", color: "var(--ink-500)", fontSize: ".875rem" }}>
          Choose how you&apos;d like to reach us:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              background: "#fff",
              textDecoration: "none",
              color: "var(--ink-900)",
              cursor: "pointer",
            }}
          >
            <SellerIcon name="phone" size={20} color="var(--success)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>WhatsApp</div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{phone}</div>
            </div>
            <SellerIcon name="chevronRight" size={16} color="var(--ink-400)" />
          </a>
          <a
            href={emailUrl}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              background: "#fff",
              textDecoration: "none",
              color: "var(--ink-900)",
              cursor: "pointer",
            }}
          >
            <SellerIcon name="mail" size={20} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>Email</div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{email}</div>
            </div>
            <SellerIcon name="chevronRight" size={16} color="var(--ink-400)" />
          </a>
        </div>

        <Button variant="ghost" full onClick={onClose} style={{ marginTop: 16 }}>
          Close
        </Button>
      </div>
    </div>
  );
}
