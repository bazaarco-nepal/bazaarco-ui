import type { Area } from "react-easy-crop";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function getCroppedBlob(
  src: string,
  area: Area,
  rotation = 0,
  maxEdge = 1200,
  type: "image/webp" | "image/jpeg" = "image/webp",
  quality = 0.85,
): Promise<Blob> {
  const image = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const work = document.createElement("canvas");
  const wctx = work.getContext("2d");
  if (!wctx) throw new Error("Canvas not supported");

  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  work.width = image.width * cos + image.height * sin;
  work.height = image.width * sin + image.height * cos;
  wctx.translate(work.width / 2, work.height / 2);
  wctx.rotate(rad);
  wctx.drawImage(image, -image.width / 2, -image.height / 2);

  const scale = Math.min(1, maxEdge / Math.max(area.width, area.height));
  const out = document.createElement("canvas");
  out.width = Math.round(area.width * scale);
  out.height = Math.round(area.height * scale);
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Canvas not supported");

  outCtx.drawImage(work, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);

  return new Promise((resolve, reject) =>
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("crop failed"))), type, quality),
  );
}
