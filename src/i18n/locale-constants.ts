// Server-safe locale constants — no react-i18next or i18next imports here.
// Import from this file in Server Components (e.g. layout.tsx) to avoid
// executing i18next's client-side init code during SSR page-data collection.

export const LOCALES = ["en", "ne"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_KEY = "bz_locale";
export const LOCALE_STORAGE_KEY = "bz_locale_v1";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
