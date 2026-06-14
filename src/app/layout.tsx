import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GoogleAnalyticsPageView } from "@/components/analytics/google-analytics-page-view";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_KEY, type Locale } from "@/i18n/locale-constants";
import "@/styles/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-loaded",
  display: "swap",
});

const SITE_NAME = "BazaarCo";
const SITE_TITLE = "BazaarCo - Nepal's Video-First Marketplace";
const SITE_DESCRIPTION =
  "Shop products through videos from verified sellers across Nepal on BazaarCo, Nepal's video-first marketplace.";
const SITE_URL = "https://bazaarconepal.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_NP",
    images: [
      {
        url: "/open-graph.png",
        width: 1200,
        height: 630,
        alt: "BazaarCo - Nepal's Video-First Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/open-graph.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the locale cookie so the server renders the same language as the client's
  // first paint. Without this, SSR always uses "en" but the client may have "ne"
  // stored — causing a React hydration mismatch on every translated string.
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const locale: Locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <html
      lang={locale === "ne" ? "ne" : "en"}
      className={`${plusJakarta.variable} ${inter.variable}`}
    >
      {/* Browser extensions (ColorZilla, Grammarly, etc.) inject attributes like
          `cz-shortcut-listen` onto <body> before React hydrates. Suppress the
          resulting attribute-only mismatch — it's external and not a real bug. */}
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <MicrosoftClarity />
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView />
        </Suspense>
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
