"use client";

import React, { useEffect, useState } from "react";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useConfirmPasswordReset, useRequestPasswordReset } from "@/hooks/use-auth";
import { isStrongPassword, passwordRequirementMessage } from "@/lib/password-validation";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  border: "1.5px solid var(--line-200)",
  borderRadius: "var(--r-md)",
  padding: "0 16px",
  fontSize: "1rem",
  fontFamily: "var(--font-sans)",
  outline: "none",
  background: "#fff",
  color: "var(--ink-900)",
};

export function PasswordResetModal({
  open,
  onClose,
  mode = "reset",
}: {
  open: boolean;
  onClose: () => void;
  mode?: "reset" | "set";
}) {
  const { nav, toast } = useBz();
  const requestReset = useRequestPasswordReset();
  const confirmReset = useConfirmPasswordReset();

  const [step, setStep] = useState<1 | 2>(1);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = requestReset.isPending || confirmReset.isPending;
  const isSet = mode === "set";
  const title = isSet ? "Set a password" : "Reset password";

  // Reset internal state whenever the modal closes so reopening starts fresh.
  useEffect(() => {
    if (open) return;
    setStep(1);
    setMaskedEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, pending]);

  if (!open) return null;

  const handleSendCode = async () => {
    setError(null);
    try {
      const res = await requestReset.mutateAsync();
      setMaskedEmail(res.email);
      setStep(2);
      toast("Code sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError(passwordRequirementMessage);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await confirmReset.mutateAsync({ otp, newPassword });
      toast("Password updated — please sign in again");
      onClose();
      nav("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-reset-title"
      onClick={() => {
        if (!pending) onClose();
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
        <h3
          id="password-reset-title"
          style={{
            margin: "0 0 12px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          {title}
        </h3>

        {step === 1 ? (
          <>
            <p
              style={{
                margin: "0 0 22px",
                color: "var(--ink-500)",
                fontSize: ".9375rem",
                lineHeight: 1.55,
              }}
            >
              {isSet
                ? "We'll email you a 6-digit code to confirm it's you. After that you can set a password and also sign in with email."
                : "We'll email you a 6-digit code to confirm it's you, then you can choose a new password."}
            </p>

            {error && (
              <p style={{ color: "var(--red)", fontSize: ".875rem", margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <div
              className="bz-modal-actions"
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={pending}
                style={{ flex: "1 1 120px" }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={requestReset.isPending}
                disabled={pending}
                onClick={() => void handleSendCode()}
                style={{ flex: "1 1 120px" }}
              >
                Send code
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleConfirm}>
            <p
              style={{
                margin: "0 0 18px",
                color: "var(--ink-500)",
                fontSize: ".9375rem",
                lineHeight: 1.55,
              }}
            >
              Enter the code we sent to <b style={{ color: "var(--ink-700)" }}>{maskedEmail}</b> and
              choose your new password.
            </p>

            <label
              style={{
                display: "block",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
                margin: "0 0 6px",
              }}
            >
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              style={{
                ...inputStyle,
                textAlign: "center",
                fontSize: "1.25rem",
                fontWeight: 800,
                letterSpacing: ".24em",
                marginBottom: 14,
              }}
              minLength={6}
              maxLength={6}
              required
            />

            <label
              style={{
                display: "block",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
                margin: "0 0 6px",
              }}
            >
              New password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8+ characters, number, symbol"
              autoComplete="new-password"
              inputStyle={inputStyle}
              style={{ marginBottom: 14 }}
            />

            <label
              style={{
                display: "block",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
                margin: "0 0 6px",
              }}
            >
              Confirm new password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              inputStyle={inputStyle}
              style={{ marginBottom: 14 }}
            />

            {error && (
              <p style={{ color: "var(--red)", fontSize: ".875rem", margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <div
              className="bz-modal-actions"
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <Button
                variant="ghost"
                type="button"
                onClick={onClose}
                disabled={pending}
                style={{ flex: "1 1 120px" }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={confirmReset.isPending}
                disabled={pending}
                style={{ flex: "1 1 120px" }}
              >
                Update password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
