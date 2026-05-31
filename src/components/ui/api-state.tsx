"use client";

import { Spinner } from "@/components/ui";

interface ApiStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ApiState({ isLoading, isError, error, children, fallback }: ApiStateProps) {
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
        <p style={{ margin: 0, fontWeight: 700, color: "var(--danger)" }}>Something went wrong</p>
        <p style={{ margin: "8px 0 0", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {error?.message ?? "Unable to load data. Please try again."}
        </p>
      </div>
    );
  }

  return children;
}
