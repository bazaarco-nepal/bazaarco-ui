"use client";

import { useEffect, useState } from "react";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useDeleteAccount, useRequestAccountDeletionOtp } from "@/hooks/use-auth";
import { useBazaarStore } from "@/store/bazaar-store";

export function SellerDeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { nav, toast } = useBz();
  const deleteMutation = useDeleteAccount();
  const otpMutation = useRequestAccountDeletionOtp();
  const user = useBazaarStore((s) => s.user);

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const requiresPassword = user?.provider === "local";
  const canRequestOtp = deleteText.trim().toUpperCase() === "DELETE" && !otpMutation.isPending;
  const canDelete =
    otp.length === 6 &&
    (!requiresPassword || deletePassword.length > 0) &&
    !deleteMutation.isPending;

  const closeModal = () => {
    setStep("request");
    setDeleteText("");
    setDeletePassword("");
    setOtp("");
    setMaskedEmail("");
    setDeleteError(null);
    setResendCooldown(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteMutation.isPending && !otpMutation.isPending) closeModal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deleteMutation.isPending, otpMutation.isPending]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!open) return null;

  const handleRequestOtp = () => {
    if (!canRequestOtp) return;
    setDeleteError(null);
    otpMutation.mutate(undefined, {
      onSuccess: (data) => {
        setMaskedEmail(data.email);
        setStep("confirm");
        setResendCooldown(30);
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not send verification code");
      },
    });
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || otpMutation.isPending) return;
    setDeleteError(null);
    otpMutation.mutate(undefined, {
      onSuccess: (data) => {
        setMaskedEmail(data.email);
        setResendCooldown(30);
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not resend code");
      },
    });
  };

  const handleDelete = () => {
    if (!canDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(
      { otp, ...(requiresPassword ? { password: deletePassword } : {}) },
      {
        onSuccess: () => {
          closeModal();
          toast("Account deleted. We're sorry to see you go.");
          nav("home");
        },
        onError: (err) => {
          setDeleteError(err instanceof Error ? err.message : "Could not delete account");
        },
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-delete-title"
      onClick={() => {
        if (!deleteMutation.isPending && !otpMutation.isPending) closeModal();
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

        {step === "request" && (
          <>
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
                marginBottom: 18,
                letterSpacing: ".02em",
              }}
            />
          </>
        )}

        {step === "confirm" && (
          <>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: ".875rem",
                color: "var(--ink-600)",
              }}
            >
              We sent a 6-digit code to <b>{maskedEmail}</b>
            </p>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Verification code
            </p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              style={{
                width: "100%",
                height: 44,
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "0 14px",
                fontSize: "1.125rem",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "6px",
                outline: "none",
                marginBottom: requiresPassword ? 12 : 4,
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
                    marginBottom: 4,
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || otpMutation.isPending}
              style={{
                background: "none",
                border: "none",
                padding: "4px 0",
                marginBottom: 14,
                color: resendCooldown > 0 ? "var(--ink-400)" : "var(--primary)",
                fontSize: ".8125rem",
                fontWeight: 600,
                cursor: resendCooldown > 0 ? "default" : "pointer",
              }}
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
            </button>
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
          <Button
            variant="primary"
            full
            disabled={deleteMutation.isPending || otpMutation.isPending}
            onClick={closeModal}
          >
            Cancel
          </Button>
          {step === "request" ? (
            <Button
              variant="danger"
              full
              disabled={!canRequestOtp}
              loading={otpMutation.isPending}
              onClick={handleRequestOtp}
            >
              Proceed
            </Button>
          ) : (
            <Button
              variant="danger"
              full
              disabled={!canDelete}
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Delete forever
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
