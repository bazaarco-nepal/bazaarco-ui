/** Cloudinary cloud name for client-side HLS playback. */
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

/**
 * Best-effort derivation of a Cloudinary publicId from a stored video URL.
 * Mirrors bazaarco-api cloudinary-client.publicIdFromUrl for legacy rows.
 */
export function publicIdFromVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) return null;

    const marker = "/upload/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const segments = parsed.pathname.slice(markerIndex + marker.length).split("/");
    while (
      segments.length > 1 &&
      (/^v\d+$/.test(segments[0] ?? "") || /[,]|^[a-z]{1,3}_/.test(segments[0] ?? ""))
    ) {
      segments.shift();
    }

    const publicId = segments.join("/").replace(/\.[^/.]+$/, "");
    return publicId.length > 0 ? publicId : null;
  } catch {
    return null;
  }
}
