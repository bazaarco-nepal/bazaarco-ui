"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, Spinner } from "@/components/ui";
import { useCreateSellerVideo, useUploadVideo } from "@/hooks/use-media-upload";
import { useSellerInventory } from "@/hooks/use-seller";

const MIN_DURATION_SEC = 5;
const MAX_DURATION_SEC = 30;

// Desktop file dialogs filter by EXTENSION, not MIME — a bare `video/*` can hide
// everything there. List explicit extensions (plus video/* for mobile galleries)
// so the picker actually shows the seller's videos.
const VIDEO_ACCEPT = "video/*,.mp4,.mov,.m4v,.webm,.avi,.mkv,.3gp,.ogv,.wmv,.flv,.mpeg,.mpg,.qt";
const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm|avi|mkv|3gp|ogv|wmv|flv|mpeg|mpg|qt)$/i;

interface VideoUploadFormProps {
  onSuccess: (status: "draft" | "published") => void;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

export function VideoUploadForm({ onSuccess, onCancel }: VideoUploadFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [productId, setProductId] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use the seller's OWN inventory (auth-scoped), not the public storefront
  // endpoint — the latter 404s until the store is KYC-verified and hides any
  // non-active listing, so the picker came up empty for new/unverified sellers.
  const { data: products, isLoading: productsLoading } = useSellerInventory();

  const uploadVideo = useUploadVideo();
  const createVideo = useCreateSellerVideo();

  const busy = uploadVideo.isPending || createVideo.isPending;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetFile = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPreviewUrl(null);
    setDurationSec(null);
    setFileName(null);
    setFileSize(null);
  };

  const onFileChange = () => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      resetFile();
      return;
    }
    // Some pickers (and a no-filter "All files" view) let through non-videos —
    // accept by MIME, or by extension when the OS reports no/blank type.
    const isVideo = file.type.startsWith("video/") || VIDEO_EXT_RE.test(file.name);
    if (!isVideo) {
      resetFile();
      setError("That isn't a video file. Choose an MP4, MOV, or other video.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setDurationSec(null);
    setFileName(file.name);
    setFileSize(file.size);
  };

  const openFilePicker = () => {
    if (busy) return;
    fileRef.current?.click();
  };

  const submit = async (status: "draft" | "published") => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a video file first.");
      return;
    }
    const selectedProduct = products?.find((p) => p.id === productId);
    if (!selectedProduct) {
      setError("Select which product this video is for.");
      return;
    }
    if (durationSec !== null && durationSec < MIN_DURATION_SEC) {
      setError(
        `Video is ${Math.ceil(durationSec)}s — must be at least ${MIN_DURATION_SEC} seconds long.`,
      );
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
        // Reels no longer carry a separate title — the product name is the label.
        title: selectedProduct.name,
        product: selectedProduct.name,
        productId: selectedProduct.id,
        videoUrl: uploaded.url,
        thumbUrl: uploaded.thumbnailUrl ?? uploaded.url,
        publicId: uploaded.publicId,
        status,
        duration: durationSec ?? 0,
      });
      setProgress(null);
      onSuccess(status);
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const durationBad =
    durationSec !== null && (durationSec < MIN_DURATION_SEC || durationSec > MAX_DURATION_SEC);

  return (
    <div className="bz-upload-form">
      <header className="bz-upload-form__header">
        <h2 className="bz-upload-form__title">Add product video</h2>
        <button
          type="button"
          className="bz-upload-form__close"
          aria-label="Close"
          disabled={busy}
          onClick={onCancel}
        >
          <Icon name="x" size={20} />
        </button>
      </header>

      <div className="bz-upload-form__body">
        <div className="bz-upload-orient">
          <div className="bz-upload-orient__shapes" aria-hidden="true">
            <span className="bz-upload-orient__phone bz-upload-orient__phone--good">
              <Icon name="check" size={13} color="#fff" />
            </span>
            <span className="bz-upload-orient__phone bz-upload-orient__phone--bad">
              <Icon name="x" size={13} color="#fff" />
            </span>
          </div>
          <div>
            <div className="bz-upload-orient__title">Hold your phone upright</div>
            <div className="bz-upload-orient__sub">
              Record tall, like a TikTok or a Reel. Don&apos;t turn your phone sideways.
            </div>
          </div>
        </div>

        <div className="bz-upload-tips">
          <div className="bz-upload-tips__head">
            <Icon name="edit" size={16} color="var(--blue)" />A few quick tips
          </div>
          <ul className="bz-upload-tips__list">
            <li>
              Keep it short — <strong>5 to 30 seconds</strong>.
            </li>
            <li>Good light, steady hands, and show the product clearly.</li>
          </ul>
        </div>

        <label className="bz-upload-form__label">Video file</label>
        <input
          ref={fileRef}
          type="file"
          accept={VIDEO_ACCEPT}
          disabled={busy}
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className={`bz-video-dropzone${fileName ? " bz-video-dropzone--filled" : ""}`}
          onClick={openFilePicker}
          disabled={busy}
        >
          <span className="bz-video-dropzone__icon">
            <Icon name={fileName ? "check" : "video"} size={26} />
          </span>
          {fileName ? (
            <>
              <span className="bz-video-dropzone__name">{fileName}</span>
              <span className="bz-video-dropzone__hint">
                {fileSize !== null ? `${formatBytes(fileSize)} · ` : ""}Tap to choose a different
                file
              </span>
            </>
          ) : (
            <>
              <span className="bz-video-dropzone__name">Choose a video to upload</span>
              <span className="bz-video-dropzone__hint">MP4 or MOV · max 100 MB · 5–30 sec</span>
            </>
          )}
        </button>

        {previewUrl && (
          <div className="bz-upload-preview">
            <video
              src={previewUrl}
              controls
              playsInline
              className="bz-upload-preview__video"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d)) setDurationSec(d);
              }}
            />
            {durationSec !== null && (
              <div className={`bz-upload-preview__meta${durationBad ? " is-bad" : ""}`}>
                {durationSec < MIN_DURATION_SEC
                  ? `Too short (${Math.ceil(durationSec)}s) — must be at least ${MIN_DURATION_SEC}s`
                  : durationSec > MAX_DURATION_SEC
                    ? `Too long (${Math.ceil(durationSec)}s) — trim before publishing`
                    : `Duration: ${Math.ceil(durationSec)}s · looks good`}
              </div>
            )}
          </div>
        )}

        <label className="bz-upload-form__label" htmlFor="bz-video-product">
          Product
        </label>
        <select
          id="bz-video-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          disabled={busy || productsLoading}
          className="bz-upload-form__input"
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
        {!productsLoading && products?.length === 0 && (
          <p className="bz-upload-form__hint">
            You have no products yet — add a product first, then film a video for it.
          </p>
        )}

        {progress !== null && (
          <div className="bz-upload-progress">
            <div className="bz-upload-progress__label">Uploading… {progress}%</div>
            <div className="bz-upload-progress__track">
              <div className="bz-upload-progress__bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && <p className="bz-upload-form__error">{error}</p>}
      </div>

      <footer className="bz-upload-form__footer">
        <Button
          type="button"
          variant="primary"
          full
          disabled={busy}
          icon={busy ? undefined : "video"}
          onClick={() => void submit("published")}
        >
          {busy ? <Spinner size={18} /> : "Publish video"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          full
          disabled={busy}
          onClick={() => void submit("draft")}
        >
          Save draft
        </Button>
        <p className="bz-upload-form__note">Draft = only you see it · Publish = live for buyers</p>
      </footer>
    </div>
  );
}
