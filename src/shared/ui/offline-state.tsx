"use client";

import type { ReactNode } from "react";

import { useNetworkStatus } from "@/shared/providers/network-provider";

export function OfflineBanner() {
  const { initialized, isOnline } = useNetworkStatus();
  if (!initialized || isOnline) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1000,
        padding: "8px 16px",
        borderTop: "1px solid var(--ink-300)",
        background: "var(--page)",
        color: "var(--ink-700)",
        fontSize: 13,
        fontWeight: 700,
        textAlign: "center",
      }}
    >
      You&apos;re offline - showing saved content.
    </div>
  );
}

export function NeedsInternet({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { initialized, isOnline } = useNetworkStatus();
  if (!initialized || isOnline) return <>{children}</>;

  return (
    <>
      {fallback ?? (
        <div role="status" style={{ color: "var(--ink-600)", fontSize: 14, fontWeight: 700 }}>
          Connect to the internet to continue.
        </div>
      )}
    </>
  );
}
