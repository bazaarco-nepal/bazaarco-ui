import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { fetchSitemapProducts, fetchSitemapSellers, type SitemapEntry } from "@/lib/seo/catalog";

// Rebuild at most hourly — fresh enough for new products/sellers, cheap enough
// not to hammer the catalog API on every crawl.
export const revalidate = 1800;

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

// Public, crawlable routes. Transactional and account pages (cart, checkout,
// profile, orders, seller dashboard) are intentionally left out and disallowed
// in robots.ts.
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: ChangeFrequency }> = [
  { path: "/home", priority: 1, changeFrequency: "daily" },
  { path: "/browse", priority: 0.9, changeFrequency: "daily" },
  { path: "/stores", priority: 0.8, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.3, changeFrequency: "monthly" },
  { path: "/how-to-order", priority: 0.3, changeFrequency: "monthly" },
  { path: "/bargaining-guide", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Dynamic reads fail soft (return []), so a backend outage shrinks the
  // sitemap to its static core rather than failing the build.
  const [sellers, products] = await Promise.all([fetchSitemapSellers(), fetchSitemapProducts()]);

  const toEntry = (
    e: SitemapEntry,
    priority: number,
    changeFrequency: ChangeFrequency,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${e.path}`,
    lastModified: e.lastModified ? new Date(e.lastModified) : now,
    changeFrequency,
    priority,
  });

  return [
    ...staticEntries,
    ...sellers.map((e) => toEntry(e, 0.7, "weekly")),
    ...products.map((e) => toEntry(e, 0.6, "weekly")),
  ];
}
