import type { MetadataRoute } from "next";
import {
  BACKGROUND_COLOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  THEME_COLOR,
} from "@/config/site";

// Next serves this at /manifest.webmanifest and injects <link rel="manifest">
// automatically — no manual tag needed. This is what makes the buyer app
// installable (Chrome's install prompt on Android, Add to Home Screen on iOS).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
