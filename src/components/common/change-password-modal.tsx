"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useChangePassword } from "@/shared/hooks/use-auth";
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

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { nav } = useBz();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = changePassword.isPending;

  useEffect(() => {
    if (open) return;
    setCurrentPassword("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError(t("common.changePassword.enterCurrent"));
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError(passwordRequirementMessage);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("common.changePassword.mismatch"));
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success(t("common.changePassword.success"));
      onClose();
      nav("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.changePassword.failed"));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
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
          id="change-password-title"
          style={{
            margin: "0 0 12px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          {t("common.changePassword.title")}
        </h3>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: ".8125rem",
              fontWeight: 700,
              color: "var(--ink-700)",
              margin: "0 0 6px",
            }}
          >
            {t("common.changePassword.currentLabel")}
          </label>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("common.changePassword.currentPlaceholder")}
            autoComplete="current-password"
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
            {t("common.changePassword.newLabel")}
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
            placeholder={t("common.changePassword.confirmPlaceholder")}
            autoComplete="new-password"
            inputStyle={inputStyle}
            style={{ marginBottom: 14 }}
          />

          {error && (
            <p style={{ color: "var(--red)", fontSize: ".875rem", margin: "0 0 12px" }}>{error}</p>
          )}

          <div className="bz-modal-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              variant="tertiary"
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
              loading={pending}
              disabled={pending}
              style={{ flex: "1 1 120px" }}
            >
              {t("common.changePassword.title")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
