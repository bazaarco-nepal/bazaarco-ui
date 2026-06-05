"use client";

import React, { useEffect, useState } from "react";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useChangePassword } from "@/hooks/use-auth";
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

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nav, toast } = useBz();
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
      setError("Enter your current password");
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
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast("Password changed — please sign in again");
      onClose();
      nav("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
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
          Change password
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
            Current password
          </label>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
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
            placeholder="Re-enter new password"
            autoComplete="new-password"
            inputStyle={inputStyle}
            style={{ marginBottom: 14 }}
          />

          {error && (
            <p style={{ color: "var(--red)", fontSize: ".875rem", margin: "0 0 12px" }}>{error}</p>
          )}

          <div className="bz-modal-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
              loading={pending}
              disabled={pending}
              style={{ flex: "1 1 120px" }}
            >
              Change password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
