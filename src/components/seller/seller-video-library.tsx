"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { VideoUploadForm } from "@/components/common/video-upload-form";
import { Button, Chip, EmptyState, Icon, Spinner } from "@/components/ui";
import { useDeleteSellerVideo, useUpdateSellerVideo } from "@/hooks/use-media-upload";
import { parseHashtags } from "@/lib/parse-hashtags";
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

  return (
    <button
      type="button"
      onClick={() => src && setPlaying((p) => !p)}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "9 / 16",
        maxHeight: 280,
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
  const [title, setTitle] = useState(video.title);
  const [product, setProduct] = useState(video.product);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(video.hashtags ?? []);
  const [status, setStatus] = useState<"draft" | "published">(
    video.status === "draft" ? "draft" : "published",
  );
  const [error, setError] = useState<string | null>(null);

  const addTags = () => {
    const next = parseHashtags(hashtagInput);
    if (next.length === 0) return;
    setHashtags((prev) => {
      const merged = [...prev];
      for (const t of next) {
        if (!merged.includes(t) && merged.length < 15) merged.push(t);
      }
      return merged;
    });
    setHashtagInput("");
  };

  const save = async () => {
    setError(null);
    if (!title.trim() || !product.trim()) {
      setError("Title and product name are required.");
      return;
    }
    try {
      await update.mutateAsync({
        videoId: video.id,
        title: title.trim(),
        product: product.trim(),
        hashtags,
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

        <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={update.isPending}
          style={{
            width: "100%",
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line-200)",
          }}
        />

        <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
          Product name
        </label>
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          disabled={update.isPending}
          style={{
            width: "100%",
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line-200)",
          }}
        />

        <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
          Hashtags
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            placeholder="#handmade"
            disabled={update.isPending}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTags())}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-200)",
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={update.isPending}
            onClick={addTags}
          >
            Add
          </Button>
        </div>
        {hashtags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {hashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <Chip tone="blue" size="sm">
                  {tag} ×
                </Chip>
              </button>
            ))}
          </div>
        )}

        <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 8 }}>
          Visibility
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Button
            type="button"
            variant={status === "draft" ? "primary" : "secondary"}
            size="sm"
            disabled={update.isPending}
            onClick={() => setStatus("draft")}
          >
            Draft
          </Button>
          <Button
            type="button"
            variant={status === "published" ? "primary" : "secondary"}
            size="sm"
            disabled={update.isPending}
            onClick={() => setStatus("published")}
          >
            Published
          </Button>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: ".8125rem", fontWeight: 600 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button variant="primary" disabled={update.isPending} onClick={() => void save()}>
            {update.isPending ? <Spinner size={18} /> : "Save changes"}
          </Button>
          <Button variant="secondary" disabled={update.isPending} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  wide,
  onEdit,
  onDeleted,
  onToast,
}: {
  video: SellerVideoItem;
  wide?: boolean;
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
    <article className={`bz-seller-video-card${wide ? " bz-seller-video-card--wide" : ""}`}>
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
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="bz-seller-video-card__tags">
            {video.hashtags.slice(0, 3).map((tag) => (
              <Chip key={tag} tone="blue" size="sm">
                {tag}
              </Chip>
            ))}
            {video.hashtags.length > 3 && (
              <span style={{ fontSize: ".65rem", color: "var(--ink-400)", alignSelf: "center" }}>
                +{video.hashtags.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="bz-seller-video-card__meta">
          <span>
            <Icon name="eye" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {video.views.toLocaleString()} views
          </span>
          <span>
            <Icon name="heart" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {video.likes} likes
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
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Videos
        </h1>
        <Button variant="primary" icon="plus" onClick={onToggleUpload}>
          {showUpload ? "Close" : "Add video"}
        </Button>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
        {videos.length} video{videos.length === 1 ? "" : "s"} · edit details, publish, or remove
      </p>

      <SellerVideoAnalyticsPanel analytics={stats} />

      {showUpload && (
        <VideoUploadForm
          onCancel={onToggleUpload}
          onSuccess={(status) => {
            onToggleUpload();
            onRefetch();
            onToast(status === "published" ? "Video published" : "Draft saved");
          }}
        />
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
          icon="video"
          title="No videos yet"
          message="Add a short vertical clip to help buyers discover your products."
          cta="Add your first video"
          onCta={onToggleUpload}
        />
      ) : videos.length === 1 ? (
        <div className="bz-seller-video-library-list">
          <VideoCard
            video={videos[0]!}
            wide
            onEdit={() => setEditing(videos[0]!)}
            onDeleted={onRefetch}
            onToast={onToast}
          />
        </div>
      ) : (
        <div
          className="bz-seller-video-library-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
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
