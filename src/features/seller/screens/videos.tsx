"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiState } from "@/components/ui";
import { SellerIcon } from "../_shared/icons";
import { SellerVideoLibrary } from "@/components/seller/seller-video-library";
import { useSellerVideos, useSellerOrganization } from "@/hooks/use-seller";
import { SellerHelpBar } from "../_shared/components";

/* ---------- 4.12 Videos ---------- */
export function SellerVideos() {
  const { t } = useTranslation();
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const vStatus = verification?.status ?? "none";
  const canSell = verification?.canSell === true;
  const { data: videosData, isLoading, isError, error, refetch } = useSellerVideos();
  const videos = videosData?.items ?? [];
  const [showUpload, setShowUpload] = useState(false);

  if (!canSell) {
    // The global verification banner (seller shell) already explains the status.
    // Keep the page body to a single calm line instead of a duplicate card.
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--ink-600)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--tint-blue-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <SellerIcon name="video" size={32} color="var(--ink-400)" />
          </div>
          <p style={{ margin: 0, fontSize: ".9375rem", fontWeight: 600, maxWidth: 320 }}>
            {t("seller.videos.verifyRequired")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px 28px 100px",
        }}
      >
        <SellerHelpBar />
        <SellerVideoLibrary
          videos={videos}
          showUpload={showUpload}
          onToggleUpload={() => setShowUpload((s) => !s)}
          onRefetch={() => void refetch()}
        />
      </div>
    </ApiState>
  );
}
