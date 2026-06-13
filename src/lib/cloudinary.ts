/** Cloudinary cloud name for client-side HLS playback. */
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

/**
 * Build a delivery URL for a buyer-facing image. We store the original upload
 * and request the right crop/format per surface at render time, so one asset
 * serves desktop + mobile without re-uploading.
 *
 * `f_auto,q_auto` let Cloudinary pick the best format/quality per device (a real
 * win on Nepal's mobile networks); `c_fill,g_auto` crops to the box without
 * distortion and keeps the subject; an explicit w×h removes layout shift.
 *
 * Non-Cloudinary upload URLs are returned untouched.
 */
export function cloudinaryImageUrl(
  url: string | null | undefined,
  opts: { width: number; height: number; dpr?: number },
): string {
  if (!url || !/\/image\/upload\//.test(url) || !url.includes("res.cloudinary.com")) {
    return url ?? "";
  }
  const transform = [
    "f_auto",
    "q_auto",
    "c_fill",
    "g_auto",
    `w_${Math.round(opts.width)}`,
    `h_${Math.round(opts.height)}`,
    `dpr_${opts.dpr ?? 2}`,
  ].join(",");
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}

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
