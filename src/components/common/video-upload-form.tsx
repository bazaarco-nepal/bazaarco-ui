"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Chip, Icon, Spinner } from "@/components/ui";
import { useCreateSellerVideo, useUploadVideo } from "@/hooks/use-media-upload";
import { parseHashtags } from "@/lib/parse-hashtags";

const MAX_DURATION_SEC = 30;

interface VideoUploadFormProps {
  onSuccess: (status: "draft" | "published") => void;
  onCancel: () => void;
}

export function VideoUploadForm({ onSuccess, onCancel }: VideoUploadFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [product, setProduct] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = useUploadVideo();
  const createVideo = useCreateSellerVideo();

  const busy = uploadVideo.isPending || createVideo.isPending;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFileChange = () => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl(null);
      setDurationSec(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setDurationSec(null);
  };

  const addHashtagsFromInput = () => {
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

  const submit = async (status: "draft" | "published") => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a video file first.");
      return;
    }
    if (!title.trim() || !product.trim()) {
      setError("Title and product name are required.");
      return;
    }
    if (durationSec !== null && durationSec > MAX_DURATION_SEC) {
      setError(
        `Video is ${Math.ceil(durationSec)}s — trim to ${MAX_DURATION_SEC}s or less in your phone editor before uploading.`,
      );
      return;
    }

    try {
      setProgress(0);
      const uploaded = await uploadVideo.mutateAsync({
        file,
        onProgress: setProgress,
      });
      await createVideo.mutateAsync({
        title: title.trim(),
        product: product.trim(),
        videoUrl: uploaded.url,
        thumbUrl: uploaded.thumbnailUrl ?? uploaded.url,
        publicId: uploaded.publicId,
        hashtags: hashtags.length > 0 ? hashtags : parseHashtags(hashtagInput),
        status,
      });
      setProgress(null);
      onSuccess(status);
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        padding: 20,
        marginBottom: 18,
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "1.125rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Add product video
      </h2>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: ".8125rem",
          color: "var(--ink-500)",
          lineHeight: 1.45,
        }}
      >
        Edit and crop on your phone first, then upload here. Buyers discover videos with hashtags on
        the feed.
      </p>

      <div
        style={{
          marginBottom: 16,
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--tint-blue-50)",
          border: "1px solid rgba(37,99,235,.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontWeight: 700,
            fontSize: ".8125rem",
            color: "var(--blue-deep)",
            marginBottom: 6,
          }}
        >
          <Icon name="edit" size={16} color="var(--blue)" />
          Edit & crop before you upload
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: ".75rem",
            color: "var(--ink-600)",
            lineHeight: 1.5,
          }}
        >
          <li>
            Trim to <strong>30 seconds or less</strong> (Photos / Gallery → Edit).
          </li>
          <li>
            Crop to vertical <strong>9:16</strong> so it looks good in the video feed.
          </li>
          <li>Good lighting, stable shot, product clearly visible.</li>
          <li>Use CapCut, InShot, or iMovie if you need filters or text overlays.</li>
        </ul>
      </div>

      <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
        Video file (max 100 MB, ≤ 30 sec)
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        disabled={busy}
        onChange={onFileChange}
        style={{ marginBottom: 12, width: "100%" }}
      />

      {previewUrl && (
        <div
          style={{
            marginBottom: 14,
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            background: "#000",
            maxWidth: 280,
          }}
        >
          <video
            src={previewUrl}
            controls
            playsInline
            style={{ width: "100%", display: "block", maxHeight: 360 }}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) setDurationSec(d);
            }}
          />
          {durationSec !== null && (
            <div
              style={{
                padding: "8px 10px",
                fontSize: ".75rem",
                fontWeight: 600,
                color: durationSec > MAX_DURATION_SEC ? "#fff" : "var(--ink-300)",
                background: durationSec > MAX_DURATION_SEC ? "var(--danger)" : "rgba(0,0,0,.6)",
              }}
            >
              {durationSec > MAX_DURATION_SEC
                ? `Too long (${Math.ceil(durationSec)}s) — trim before publishing`
                : `Duration: ${Math.ceil(durationSec)}s · looks good`}
            </div>
          )}
        </div>
      )}

      <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
        Title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={busy}
        placeholder="e.g. Pashmina shawl — try-on"
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
        disabled={busy}
        placeholder="Which product is this for?"
        style={{
          width: "100%",
          marginBottom: 14,
          padding: "10px 12px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--line-200)",
        }}
      />

      <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
        Hashtags
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <input
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          disabled={busy}
          placeholder="#handmade #kathmandu #sale"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addHashtagsFromInput();
            }
          }}
          style={{
            flex: "1 1 180px",
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line-200)",
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={addHashtagsFromInput}
        >
          Add tags
        </Button>
      </div>
      {hashtags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={busy}
              onClick={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              title="Remove"
            >
              <Chip tone="blue" size="sm">
                {tag} ×
              </Chip>
            </button>
          ))}
        </div>
      )}
      <p style={{ margin: "0 0 14px", fontSize: ".75rem", color: "var(--ink-400)" }}>
        Tip: #bazaarco #madeinnepal plus your city and category help buyers find you.
      </p>

      {progress !== null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginBottom: 4 }}>
            Uploading… {progress}%
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "var(--line-100)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--blue)",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p
          style={{
            margin: "0 0 12px",
            color: "var(--danger)",
            fontSize: ".8125rem",
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          type="button"
          variant="primary"
          disabled={busy}
          icon={busy ? undefined : "video"}
          onClick={() => void submit("published")}
        >
          {busy ? <Spinner size={18} /> : "Publish video"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void submit("draft")}
        >
          Save draft
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <p className="ne" style={{ margin: "10px 0 0", fontSize: ".7rem", color: "var(--ink-400)" }}>
        Draft = only you see it · Publish = live for buyers (with hashtags)
      </p>
    </div>
  );
}
