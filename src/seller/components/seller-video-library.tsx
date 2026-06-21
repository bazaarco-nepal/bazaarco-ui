"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VideoUploadForm } from "@/components/common/video-upload-form";
import { Button, EmptyState, Icon, Spinner, VideoPlayer } from "@/components/ui";
import { useDeleteSellerVideo, useUpdateSellerVideo } from "@/shared/hooks/use-media-upload";
import { useSellerInventory } from "@/seller/hooks/use-seller";
import { VideoDeleteConfirmModal } from "@/seller/components/video-delete-confirm-modal";
import { SellerPageHeader } from "@/seller/features/_shared/components";
import { toast } from "@/shared/lib/toast";
import type { SellerVideoItem } from "@/shared/api/media";

function VideoEditModal({
  video,
  onClose,
  onSaved,
}: {
  video: SellerVideoItem;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateSellerVideo();
  // Seller's OWN inventory (auth-scoped) — the public catalog endpoint 404s
  // until the store is verified and hides non-active listings, leaving the
  // picker empty. See video-upload-form.tsx for the same fix.
  const { data: products, isLoading: productsLoading } = useSellerInventory();
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">(
    video.status === "draft" ? "draft" : "published",
  );
  const [error, setError] = useState<string | null>(null);

  // Preselect the dropdown to the video's current product once the list loads.
  useEffect(() => {
    if (!productId && products) {
      const match = products.find((p) => p.name === video.productLabel);
      if (match) setProductId(match.id);
    }
  }, [products, productId, video.productLabel]);

  const save = async () => {
    setError(null);
    const selectedProduct = products?.find((p) => p.id === productId);
    if (!selectedProduct) {
      setError(t("seller.videoLibrary.selectProductError"));
      return;
    }
    try {
      await update.mutateAsync({
        videoId: video.id,
        title: selectedProduct.name,
        product: selectedProduct.name,
        status,
      });
      onSaved(
        status === "published"
          ? t("seller.videoLibrary.updatedPublished")
          : t("seller.videoLibrary.draftUpdated"),
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("seller.videoLibrary.saveFailed"));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15,23,42,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--r-lg)",
          padding: 22,
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 14px", fontSize: "1.125rem", fontWeight: 800 }}>
          {t("seller.videoLibrary.editVideo")}
        </h2>

        <label
          htmlFor="bz-edit-video-product"
          style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}
        >
          {t("seller.videoLibrary.product")}
        </label>
        <select
          id="bz-edit-video-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          disabled={update.isPending || productsLoading}
          style={{
            width: "100%",
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line-200)",
            background: "#fff",
          }}
        >
          <option value="">
            {productsLoading
              ? t("seller.videoLibrary.loadingProducts")
              : t("seller.videoLibrary.selectProduct")}
          </option>
          {products?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 8 }}>
          {t("seller.videoLibrary.visibility")}
        </label>
        {/* Sliding segmented switch — one control with a single active state,
            instead of two same-shaped pills where it's unclear which is "on". */}
        <div
          role="radiogroup"
          aria-label={t("seller.videoLibrary.visibility")}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "var(--line-100)",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-full)",
            padding: 4,
            marginBottom: 6,
            opacity: update.isPending ? 0.6 : 1,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: status === "draft" ? 4 : "50%",
              width: "calc(50% - 4px)",
              background: "#fff",
              borderRadius: "var(--r-full)",
              boxShadow: "0 1px 3px rgba(0,0,0,.14)",
              transition: "left var(--dur-standard) var(--ease)",
            }}
          />
          {(
            [
              { value: "draft", label: t("seller.videoLibrary.draft"), dot: "var(--saffron)" },
              {
                value: "published",
                label: t("seller.videoLibrary.published"),
                dot: "var(--success)",
              },
            ] as const
          ).map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={update.isPending}
                onClick={() => setStatus(opt.value)}
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  height: 36,
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--r-full)",
                  fontFamily: "var(--font-sans)",
                  fontSize: ".875rem",
                  fontWeight: active ? 700 : 600,
                  color: active ? "var(--ink-900)" : "var(--ink-400)",
                  cursor: update.isPending ? "not-allowed" : "pointer",
                  transition: "color var(--dur-standard) var(--ease)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "var(--r-full)",
                    background: active ? opt.dot : "var(--ink-300)",
                  }}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
        <p style={{ margin: "0 0 14px", fontSize: ".75rem", color: "var(--ink-400)" }}>
          {status === "published"
            ? t("seller.videoLibrary.publishedHint")
            : t("seller.videoLibrary.draftHint")}
        </p>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: ".8125rem", fontWeight: 600 }}>{error}</p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <Button
            variant="primary"
            style={{ flex: 1 }}
            disabled={update.isPending}
            onClick={() => void save()}
          >
            {update.isPending ? <Spinner size={18} /> : t("seller.videoLibrary.saveChanges")}
          </Button>
          <Button variant="ghost" disabled={update.isPending} onClick={onClose}>
            {t("seller.videoLibrary.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  onEdit,
  onDeleted,
}: {
  video: SellerVideoItem;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const del = useDeleteSellerVideo();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await del.mutateAsync(video.id);
      setConfirmingDelete(false);
      toast.success(t("seller.videoLibrary.videoDeleted"));
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("seller.videoLibrary.deleteFailed"));
    }
  };

  return (
    <article className="bz-seller-video-card">
      <div className="bz-seller-video-card__media">
        {/* Same VideoPlayer the buyer watch feed uses, so tapping play streams
            the clip over Cloudinary HLS exactly as buyers see it. deferStream
            keeps the grid light — HLS only attaches once the seller hits play. */}
        <VideoPlayer
          ratio="4 / 5"
          radius="0"
          deferStream
          label={false}
          tint={video.tint}
          icon={video.icon}
          thumb={video.thumb}
          src={video.videoUrl}
          publicId={video.videoPublicId}
        />
      </div>
      <div className="bz-seller-video-card__body">
        <div className="bz-seller-video-card__for">
          {t("seller.videoLibrary.forLabel")} <span>{video.productLabel}</span>
        </div>
        <div className="bz-seller-video-card__views">
          <Icon name="eye" size={13} />
          {t("seller.videoLibrary.viewCount", {
            count: video.views,
            formatted: video.views.toLocaleString("en-IN"),
          })}
        </div>
        <div className="bz-seller-video-card__actions">
          <Button variant="secondary" size="sm" icon="edit" full onClick={onEdit}>
            {t("seller.videoLibrary.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="trash"
            full
            disabled={del.isPending}
            onClick={() => setConfirmingDelete(true)}
          >
            {t("seller.videoLibrary.delete")}
          </Button>
        </div>
      </div>
      <VideoDeleteConfirmModal
        open={confirmingDelete}
        pending={del.isPending}
        productLabel={video.productLabel}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </article>
  );
}

export function SellerVideoLibrary({
  videos,
  showUpload,
  onToggleUpload,
  onRefetch,
}: {
  videos: SellerVideoItem[];
  showUpload: boolean;
  onToggleUpload: () => void;
  onRefetch: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<SellerVideoItem | null>(null);

  return (
    <>
      <SellerPageHeader
        title={t("seller.videoLibrary.title")}
        subtitle={t("seller.videoLibrary.subtitle")}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={onToggleUpload}
            style={{ flexShrink: 0 }}
          >
            {t("seller.videoLibrary.addVideo")}
          </Button>
        }
      />

      {showUpload && (
        <div
          className="bz-upload-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("seller.videoLibrary.addVideoDialog")}
          onClick={onToggleUpload}
        >
          <div className="bz-upload-sheet" onClick={(e) => e.stopPropagation()}>
            <VideoUploadForm
              onCancel={onToggleUpload}
              onSuccess={(status) => {
                onToggleUpload();
                onRefetch();
                toast.success(
                  status === "published"
                    ? t("seller.videoLibrary.videoPublished")
                    : t("seller.videoLibrary.draftSaved"),
                );
              }}
            />
          </div>
        </div>
      )}

      {videos.length === 0 && !showUpload ? (
        <EmptyState
          icon="video"
          title={t("seller.videoLibrary.emptyTitle")}
          message={t("seller.videoLibrary.emptyMessage")}
        />
      ) : (
        <div className="bz-seller-video-library-grid">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onEdit={() => setEditing(v)} onDeleted={onRefetch} />
          ))}
        </div>
      )}

      {editing && (
        <VideoEditModal
          video={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            onRefetch();
            toast.success(msg);
          }}
        />
      )}
    </>
  );
}
