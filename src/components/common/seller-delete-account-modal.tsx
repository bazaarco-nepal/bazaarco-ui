"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trans, useTranslation } from "react-i18next";

import { Button, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common/marketplace";
import { useDeleteAccount, useRequestAccountDeletionOtp } from "@/shared/hooks/use-auth";
import { useBazaarStore } from "@/store/bazaar-store";
import { toast } from "@/lib/toast";

export function SellerDeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { nav } = useBz();
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
        setDeleteError(
          err instanceof Error ? err.message : t("common.deleteSellerAccount.sendCodeFailed"),
        );
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
        setDeleteError(
          err instanceof Error ? err.message : t("common.deleteSellerAccount.resendFailed"),
        );
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
          toast.success(t("common.deleteSellerAccount.deleted"));
          nav("home");
        },
        onError: (err) => {
          setDeleteError(
            err instanceof Error ? err.message : t("common.deleteSellerAccount.deleteFailed"),
          );
        },
      },
    );
  };

  if (typeof document === "undefined") return null;

  const dismiss = () => {
    if (!deleteMutation.isPending && !otpMutation.isPending) closeModal();
  };

  return createPortal(
    // The modal opens from seller page content; portal'ing to <body> keeps the
    // fixed overlay clear of any transformed ancestor (matching the store
    // switcher), and re-asserting data-skin="fluent" guarantees the inputs and
    // buttons inside render in the seller's Fluent skin, not the buyer theme.
    <div
      data-skin="fluent"
      className="bz-store-modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-delete-title"
      onClick={dismiss}
    >
      <div className="bz-store-modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="seller-delete-title" className="bz-store-modal-title">
          {t("common.deleteSellerAccount.title")}
        </h3>
        <p className="bz-del-warning">
          <Trans i18nKey="common.deleteSellerAccount.warning" components={{ strong: <b /> }} />
        </p>

        {step === "request" && (
          <label className="bz-store-field">
            <span className="bz-store-field-label">
              <Trans
                i18nKey="common.deleteSellerAccount.typeToConfirm"
                components={{ strong: <b /> }}
              />
            </span>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder={t("common.deleteSellerAccount.typePlaceholder")}
              autoFocus
              className="bz-store-field-input"
            />
          </label>
        )}

        {step === "confirm" && (
          <>
            <p className="bz-store-field-hint">
              <Trans
                i18nKey="common.deleteSellerAccount.codeSent"
                values={{ email: maskedEmail }}
                components={{ strong: <b /> }}
              />
            </p>
            <label className="bz-store-field">
              <span className="bz-store-field-label">
                {t("common.deleteSellerAccount.codeLabel")}
              </span>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                className="bz-store-field-input bz-del-otp"
              />
            </label>
            {requiresPassword && (
              <label className="bz-store-field">
                <span className="bz-store-field-label">
                  {t("common.deleteSellerAccount.confirmPasswordLabel")}
                </span>
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t("common.deleteSellerAccount.passwordPlaceholder")}
                  autoComplete="current-password"
                  className="bz-store-field-input"
                />
              </label>
            )}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || otpMutation.isPending}
              className="bz-del-resend"
            >
              {resendCooldown > 0
                ? t("common.deleteSellerAccount.resendIn", { seconds: resendCooldown })
                : t("common.deleteSellerAccount.resend")}
            </button>
          </>
        )}

        {deleteError && <p className="bz-del-error">{deleteError}</p>}

        <div className="bz-store-modal-actions">
          <Button
            variant="secondary"
            disabled={deleteMutation.isPending || otpMutation.isPending}
            onClick={closeModal}
          >
            {t("common.cancel")}
          </Button>
          {step === "request" ? (
            <Button
              variant="danger"
              disabled={!canRequestOtp}
              loading={otpMutation.isPending}
              onClick={handleRequestOtp}
            >
              {t("common.deleteSellerAccount.proceed")}
            </Button>
          ) : (
            <Button
              variant="danger"
              disabled={!canDelete}
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {t("common.deleteSellerAccount.deleteForever")}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
