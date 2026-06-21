"use client";

import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useConfirmPasswordReset, useRequestPasswordReset } from "@/shared/hooks/use-auth";
import { isStrongPassword, passwordRequirementMessage } from "@/shared/lib/password-validation";
import { toast } from "@/shared/lib/toast";

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
  const { t } = useTranslation();
  const { nav } = useBz();
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
  const title = isSet ? t("common.passwordReset.setTitle") : t("common.passwordReset.resetTitle");

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
      toast.success(t("common.passwordReset.codeSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.passwordReset.sendFailed"));
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError(t("common.passwordReset.enterCode"));
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError(passwordRequirementMessage);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("common.passwordReset.mismatch"));
      return;
    }

    try {
      await confirmReset.mutateAsync({ otp, newPassword });
      toast.success(t("common.passwordReset.updated"));
      onClose();
      nav("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.passwordReset.updateFailed"));
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
              {isSet ? t("common.passwordReset.introSet") : t("common.passwordReset.introReset")}
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
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                loading={requestReset.isPending}
                disabled={pending}
                onClick={() => void handleSendCode()}
                style={{ flex: "1 1 120px" }}
              >
                {t("common.passwordReset.sendCode")}
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
              <Trans
                i18nKey="common.passwordReset.codeIntro"
                values={{ email: maskedEmail }}
                components={{ strong: <b style={{ color: "var(--ink-700)" }} /> }}
              />
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
              {t("common.passwordReset.codeLabel")}
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
              {t("common.passwordReset.newLabel")}
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("common.passwordHint")}
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
              {t("common.changePassword.confirmLabel")}
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("common.passwordReset.confirmPlaceholder")}
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
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={confirmReset.isPending}
                disabled={pending}
                style={{ flex: "1 1 120px" }}
              >
                {t("common.passwordReset.updatePassword")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
