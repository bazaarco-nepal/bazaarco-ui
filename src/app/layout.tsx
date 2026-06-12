import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
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

export const metadata: Metadata = {
  title: "BazaarCo - Shop",
  description: "Nepal's fair marketplace",
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
        <MicrosoftClarity />
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
