"use client";

import React from "react";
import { Button } from "@/components/ui";
import { useCurrentUser } from "@/shared/hooks/use-auth";
import { usePendingSellerVerifications, useReviewSellerVerification } from "@/seller/hooks/use-admin";

/* ---------- Admin: seller verification queue ---------- */

export function AdminSellerVerifications() {
  const { data: me } = useCurrentUser();
  const { data: pending = [], isLoading, isError, refetch } = usePendingSellerVerifications(!!me);
  const review = useReviewSellerVerification();

  return (
    <div className="bz-seller-page">
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--ink-900)",
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
          Could not load queue. This area is admin-only — your account may not have access.
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
                <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{row.shopName}</div>
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
