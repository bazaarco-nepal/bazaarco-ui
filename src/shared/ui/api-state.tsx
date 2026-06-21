"use client";

import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui";

interface ApiStateProps {
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ApiState({ isLoading, isError = false, error, children, fallback }: ApiStateProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      fallback ?? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 28px" }}>
          <Spinner size={32} />
        </div>
      )
    );
  }

  if (isError) {
    return (
      <div style={{ maxWidth: 640, margin: "48px auto", padding: "0 28px", textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "var(--danger)" }}>
          {t("common.apiState.errorTitle")}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {error?.message ?? t("common.apiState.errorMessage")}
        </p>
      </div>
    );
  }

  return children;
}
