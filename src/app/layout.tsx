import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GoogleAnalyticsPageView } from "@/components/analytics/google-analytics-page-view";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_KEY, type Locale } from "@/i18n/locale-constants";
import {
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR,
} from "@/config/site";
import { IosInstallBanner } from "@/components/common/ios-install-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationSchema, websiteSchema } from "@/shared/lib/seo/structured-data";
import "@/styles/globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});

// Tabular numerics across the buyer UI (prices, badges, countdowns) read from
// --font-mono so money lines up — see tokens.css.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono-loaded",
  display: "swap",
});

// Display face for section headings / hero — see --font-display in tokens.css.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // iOS ignores the web manifest for the home-screen icon and reads
  // <link rel="apple-touch-icon"> directly.
  icons: {
    apple: "/icons/icon-192.png",
  },
  // Emits <meta name="apple-mobile-web-app-capable" content="yes"> so Safari
  // launches the saved shortcut as a standalone app (no browser chrome).
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_NP",
    images: [
      {
        url: OG_IMAGE,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// Emits <meta name="theme-color"> — colors the browser/standalone chrome.
export const viewport: Viewport = {
  themeColor: THEME_COLOR,
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
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${bricolage.variable}`}
    >
      {/* Browser extensions (ColorZilla, Grammarly, etc.) inject attributes like
          `cz-shortcut-listen` onto <body> before React hydrates. Suppress the
          resulting attribute-only mismatch — it's external and not a real bug. */}
      <body suppressHydrationWarning>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <GoogleAnalytics />
        <MicrosoftClarity />
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView />
        </Suspense>
        <SpeedInsights />
        <AppProviders initialLocale={locale}>
          {children}
          <IosInstallBanner />
        </AppProviders>
      </body>
    </html>
  );
}
