"use client";

import { useRef, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { useCreateSellerVideo, useUploadVideo } from "@/hooks/use-media-upload";

interface VideoUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function VideoUploadForm({ onSuccess, onCancel }: VideoUploadFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [product, setProduct] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = useUploadVideo();
  const createVideo = useCreateSellerVideo();

  const busy = uploadVideo.isPending || createVideo.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      });
      setProgress(null);
      onSuccess();
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        border: "1.5px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        padding: 20,
        marginBottom: 18,
      }}
    >
      <h2 style={{ margin: "0 0 14px", fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        Upload product video
      </h2>

      <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, marginBottom: 6 }}>
        Video file (max 100 MB)
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        disabled={busy}
        style={{ marginBottom: 14, width: "100%" }}
      />

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

      {progress !== null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginBottom: 4 }}>
            Uploading… {progress}%
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--line-100)", overflow: "hidden" }}>
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
        <p style={{ margin: "0 0 12px", color: "var(--danger)", fontSize: ".8125rem", fontWeight: 600 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button type="submit" variant="primary" disabled={busy} icon={busy ? undefined : "video"}>
          {busy ? <Spinner size={18} /> : "Upload to Cloudinary"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
