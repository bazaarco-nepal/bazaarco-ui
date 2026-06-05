"use client";

import { useEffect, useState } from "react";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useDeleteAccount } from "@/hooks/use-auth";
import { useBazaarStore } from "@/store/bazaar-store";

/**
 * Seller "Delete account" confirmation modal. Same flow as the buyer's
 * (type DELETE + password for local accounts) and hits the same DELETE
 * /auth/me endpoint, which cascade-deletes the shop, products, reviews,
 * conversations and all personal data (blocked server-side while any order
 * references the seller's products). Shared by the seller profile + settings.
 */
export function SellerDeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { nav, toast } = useBz();
  const deleteMutation = useDeleteAccount();
  const user = useBazaarStore((s) => s.user);

  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const requiresPassword = user?.provider === "local";
  const canDelete =
    deleteText.trim().toUpperCase() === "DELETE" &&
    (!requiresPassword || deletePassword.length > 0) &&
    !deleteMutation.isPending;

  const closeModal = () => {
    setDeleteText("");
    setDeletePassword("");
    setDeleteError(null);
    onClose();
  };

  // Escape-to-close + body scroll-lock while open (ignored while deleting).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteMutation.isPending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deleteMutation.isPending]);

  if (!open) return null;

  const handleDelete = () => {
    if (!canDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(requiresPassword ? { password: deletePassword } : undefined, {
      onSuccess: () => {
        closeModal();
        toast("Account deleted. We're sorry to see you go.");
        nav("home");
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not delete account");
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-delete-title"
      onClick={() => {
        if (!deleteMutation.isPending) closeModal();
      }}
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
      <style>{`
        .bz-delete-actions { display: flex; gap: 10px; flex-direction: row; }
        @media (max-width: 480px) { .bz-delete-actions { flex-direction: column; } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: "100%",
          maxWidth: 460,
          boxShadow: "var(--sh-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--tint-red-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "var(--danger)",
              fontWeight: 800,
              fontSize: 24,
            }}
          >
            !
          </div>
          <h3
            id="seller-delete-title"
            style={{
              margin: 0,
              fontSize: "1.125rem",
              fontWeight: 800,
              color: "var(--ink-900)",
            }}
          >
            Delete your seller account?
          </h3>
        </div>
        <p
          style={{
            margin: "0 0 14px",
            color: "var(--ink-500)",
            fontSize: ".9375rem",
            lineHeight: 1.5,
          }}
        >
          This is <b style={{ color: "var(--danger)" }}>permanent</b>. Your shop, all your product
          listings, reviews, and messages will be removed. If your products have any existing
          orders, deletion is blocked — contact support instead.
        </p>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: ".8125rem",
            fontWeight: 700,
            color: "var(--ink-700)",
          }}
        >
          Type <b style={{ color: "var(--danger)" }}>DELETE</b> to confirm
        </p>
        <input
          value={deleteText}
          onChange={(e) => setDeleteText(e.target.value)}
          placeholder="Type DELETE"
          autoFocus
          style={{
            width: "100%",
            height: 44,
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-md)",
            padding: "0 14px",
            fontSize: ".9375rem",
            fontFamily: "var(--font-sans)",
            outline: "none",
            marginBottom: requiresPassword ? 12 : 18,
            letterSpacing: ".02em",
          }}
        />
        {requiresPassword && (
          <>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Confirm your password
            </p>
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              inputStyle={{
                width: "100%",
                height: 44,
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "0 14px",
                fontSize: ".9375rem",
                fontFamily: "var(--font-sans)",
                outline: "none",
                marginBottom: 18,
              }}
            />
          </>
        )}
        {deleteError && (
          <p
            style={{
              margin: "0 0 14px",
              color: "var(--danger)",
              fontSize: ".875rem",
              fontWeight: 600,
            }}
          >
            {deleteError}
          </p>
        )}
        <div className="bz-delete-actions">
          <Button variant="secondary" full disabled={deleteMutation.isPending} onClick={closeModal}>
            Keep account
          </Button>
          <Button
            variant="danger"
            full
            disabled={!canDelete}
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Delete forever
          </Button>
        </div>
      </div>
    </div>
  );
}
