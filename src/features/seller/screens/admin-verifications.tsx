"use client";

import React from "react";
import { Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/use-auth";
import { usePendingSellerVerifications, useReviewSellerVerification } from "@/hooks/use-admin";


/* ---------- Admin: seller verification queue ---------- */

function isAdminUser(email: string | undefined): boolean {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email || list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export function AdminSellerVerifications() {
  const { data: me } = useCurrentUser();
  const {
    data: pending = [],
    isLoading,
    isError,
    refetch,
  } = usePendingSellerVerifications(isAdminUser(me?.email));
  const review = useReviewSellerVerification();

  if (!isAdminUser(me?.email)) {
    return (
      <div className="bz-seller-page">
        <p style={{ color: "var(--ink-600)" }}>
          Admin access only. Set NEXT_PUBLIC_ADMIN_EMAILS to match your login.
        </p>
      </div>
    );
  }

  return (
    <div className="bz-seller-page">
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Seller verifications
      </h1>
      <p style={{ margin: "0 0 20px", color: "var(--ink-500)", fontSize: ".875rem" }}>
        Approve NID/PAN uploads before sellers can add products or videos.
      </p>
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p style={{ color: "var(--red)" }}>
          Could not load queue. Check ADMIN_EMAILS on the backend matches your account.
        </p>
      )}
      {!isLoading && pending.length === 0 && (
        <p style={{ color: "var(--ink-500)" }}>No pending verifications.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {pending.map((row) => (
          <div
            key={row.sellerId}
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {row.verification.docUrl && (
                <a href={row.verification.docUrl} target="_blank" rel="noreferrer">
                  <img
                    src={row.verification.docUrl}
                    alt=""
                    style={{
                      width: 140,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--line-200)",
                    }}
                  />
                </a>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{row.shopName}</div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 4 }}>
                  {row.userEmail} · {row.verification.docType?.toUpperCase()}
                  {row.verification.docIdNumber ? ` · ${row.verification.docIdNumber}` : ""}
                </div>
                {row.verification.ownerName && (
                  <div style={{ fontSize: ".8125rem", marginTop: 6 }}>
                    {row.verification.ownerName}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate(
                        { sellerId: row.sellerId, action: "approve" },
                        { onSuccess: () => void refetch() },
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate(
                        {
                          sellerId: row.sellerId,
                          action: "reject",
                          note: "Document unclear or invalid",
                        },
                        { onSuccess: () => void refetch() },
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
