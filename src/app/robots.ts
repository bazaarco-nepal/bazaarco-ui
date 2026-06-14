import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

// Crawlers may index the public storefront, but not transactional or account
// pages — they're gated, user-specific, or useless in search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth",
        "/cart",
        "/checkout",
        "/wishlist",
        "/profile",
        "/orders",
        "/bargains",
        "/messages",
        "/review",
        "/seller/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
