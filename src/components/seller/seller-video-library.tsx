"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { VideoUploadForm } from "@/components/common/video-upload-form";
import { Button, Chip, EmptyState, Icon, Spinner } from "@/components/ui";
import { useDeleteSellerVideo, useUpdateSellerVideo } from "@/hooks/use-media-upload";
import { useSellerInventory } from "@/hooks/use-seller";
import {
  SellerVideoAnalyticsPanel,
  type SellerVideoAnalytics,
} from "@/components/seller/seller-video-analytics";
import type { SellerVideoItem } from "@/services/api/media";

const EMPTY_ANALYTICS: SellerVideoAnalytics = {
  totals: {
    views: 0,
    likes: 0,
    videos: 0,
    published: 0,
    drafts: 0,
    engagementRate: 0,
  },
  viewsByDay: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => ({
    label,
    value: 0,
  })),
  topVideos: [],
  statusBreakdown: [
    { label: "Published", value: 0, color: "var(--success)" },
    { label: "Draft", value: 0, color: "var(--saffron)" },
  ],
};

function VideoThumb({
  src,
  thumb,
  title,
}: {
  src: string | null | undefined;
  thumb?: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  // Clips are vertical 9:16 — same as the buyer watch stage — so we frame the
  // thumbnail at the exact ratio buyers see, with no cropping.
  return (
    <button
      type="button"
      onClick={() => src && setPlaying((p) => !p)}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "9 / 16",
        border: "none",
        padding: 0,
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        background: "#111",
        cursor: src ? "pointer" : "default",
        display: "block",
      }}
    >
      {src ? (
        <video
          src={src}
          poster={thumb}
          playsInline
          muted
          loop
          autoPlay={playing}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : thumb ? (
        <img
          src={thumb}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-400)",
          }}
        >
          <Icon name="video" size={28} />
        </div>
      )}
      {!playing && src && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.25)",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="play" size={18} color="var(--blue-deep)" />
          </span>
        </span>
      )}
    </button>
  );
}

function VideoEditModal({
  video,
  onClose,
  onSaved,
}: {
  video: SellerVideoItem;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
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
      const match = products.find((p) => p.name === video.product);
      if (match) setProductId(match.id);
    }
  }, [products, productId, video.product]);

  const save = async () => {
    setError(null);
    const selectedProduct = products?.find((p) => p.id === productId);
    if (!selectedProduct) {
      setError("Select which product this video is for.");
      return;
    }
    try {
      await update.mutateAsync({
        videoId: video.id,
        title: selectedProduct.name,
        product: selectedProduct.name,
        status,
      });
      onSaved(status === "published" ? "Video updated & published" : "Draft updated");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
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
        <h2 style={{ margin: "0 0 14px", fontSize: "1.125rem", fontWeight: 800 }}>Edit video</h2>

        <label
          htmlFor="bz-edit-video-product"
          style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}
        >
          Product
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
            {productsLoading ? "Loading your products…" : "Select a product…"}
          </option>
          {products?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 8 }}>
          Visibility
        </label>
        {/* Sliding segmented switch — one control with a single active state,
            instead of two same-shaped pills where it's unclear which is "on". */}
        <div
          role="radiogroup"
          aria-label="Visibility"
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
              { value: "draft", label: "Draft", dot: "var(--saffron)" },
              { value: "published", label: "Published", dot: "var(--success)" },
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
            ? "Live — buyers can see this video."
            : "Draft — only you can see this video."}
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
            {update.isPending ? <Spinner size={18} /> : "Save changes"}
          </Button>
          <Button variant="ghost" disabled={update.isPending} onClick={onClose}>
            Cancel
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
  onToast,
}: {
  video: SellerVideoItem;
  onEdit: () => void;
  onDeleted: () => void;
  onToast: (msg: string) => void;
}) {
  const del = useDeleteSellerVideo();

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(video.id);
      onToast("Video deleted");
      onDeleted();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <article className="bz-seller-video-card">
      <div className="bz-seller-video-card__media">
        <VideoThumb src={video.videoUrl} thumb={video.thumb} title={video.title} />
      </div>
      <div className="bz-seller-video-card__body">
        <div className="bz-seller-video-card__title-row">
          <div className="bz-seller-video-card__title">{video.title}</div>
          <Chip tone={video.status === "draft" ? "saffron" : "success"} size="sm">
            {video.status === "draft" ? "Draft" : "Live"}
          </Chip>
        </div>
        <div
          style={{
            fontSize: ".75rem",
            color: "var(--ink-500)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {video.product}
        </div>
        <div className="bz-seller-video-card__meta">
          <span>
            <Icon name="eye" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {video.views.toLocaleString("en-IN")} views
          </span>
        </div>
        <div className="bz-seller-video-card__actions">
          <Button variant="secondary" size="sm" icon="edit" full onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="trash"
            full
            disabled={del.isPending}
            onClick={() => void handleDelete()}
          >
            {del.isPending ? "…" : "Delete"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function SellerVideoLibrary({
  videos,
  analytics,
  showUpload,
  onToggleUpload,
  onRefetch,
  onToast,
}: {
  videos: SellerVideoItem[];
  analytics?: SellerVideoAnalytics;
  showUpload: boolean;
  onToggleUpload: () => void;
  onRefetch: () => void;
  onToast: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<SellerVideoItem | null>(null);
  const stats = analytics ?? {
    ...EMPTY_ANALYTICS,
    totals: {
      ...EMPTY_ANALYTICS.totals,
      videos: videos.length,
      published: videos.filter((v) => v.status === "published").length,
      drafts: videos.filter((v) => v.status !== "published").length,
      views: videos.reduce((s, v) => s + v.views, 0),
      likes: videos.reduce((s, v) => s + v.likes, 0),
    },
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          gap: 10,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Videos
        </h1>
        <Button
          variant="primary"
          size="sm"
          icon="plus"
          onClick={onToggleUpload}
          style={{ flexShrink: 0 }}
        >
          Add video
        </Button>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
        {videos.length} video{videos.length === 1 ? "" : "s"} · edit details, publish, or remove
      </p>

      <SellerVideoAnalyticsPanel analytics={stats} />

      {showUpload && (
        <div
          className="bz-upload-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Add product video"
          onClick={onToggleUpload}
        >
          <div className="bz-upload-sheet" onClick={(e) => e.stopPropagation()}>
            <VideoUploadForm
              onCancel={onToggleUpload}
              onSuccess={(status) => {
                onToggleUpload();
                onRefetch();
                onToast(status === "published" ? "Video published" : "Draft saved");
              }}
            />
          </div>
        </div>
      )}

      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "1rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Your library
      </h2>

      {videos.length === 0 && !showUpload ? (
        <EmptyState
          title="No videos yet"
          message="Add a short vertical clip to help buyers discover your products. Tap “Add video” at the top to upload your first one."
        />
      ) : (
        <div className="bz-seller-video-library-grid">
          {videos.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onEdit={() => setEditing(v)}
              onDeleted={onRefetch}
              onToast={onToast}
            />
          ))}
        </div>
      )}

      {editing && (
        <VideoEditModal
          video={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            onRefetch();
            onToast(msg);
          }}
        />
      )}
    </>
  );
}
