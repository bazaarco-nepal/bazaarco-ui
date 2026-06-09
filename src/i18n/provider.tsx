"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { useBazaarStore } from "@/store/bazaar-store";
import { DEFAULT_LOCALE, type Locale } from "./locale-constants";
import { i18n } from "./config";

interface I18nProviderProps {
  children: React.ReactNode;
  /** Locale determined server-side from the locale cookie. Passed so the first
   *  render (both SSR and client hydration) uses the same language, eliminating
   *  the hydration mismatch that occurred when the i18n singleton retained a
   *  stale "ne" language from a previous client-side navigation. */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const locale = useBazaarStore((s) => s.locale);
  const hydrateLocale = useBazaarStore((s) => s.hydrateLocale);

  // Prime i18n synchronously with the server-determined locale so the very
  // first render (used for both SSR and client hydration) produces the same
  // output. useState initializer runs once per component mount, synchronously,
  // on both server and client — making it the right place for this.
  useState(() => {
    void i18n.changeLanguage(initialLocale);
  });

  useEffect(() => {
    hydrateLocale();
  }, [hydrateLocale]);

  useEffect(() => {
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale === "ne" ? "ne" : "en";
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
