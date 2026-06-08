"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import { useBazaarStore } from "@/store/bazaar-store";
import { i18n } from "./config";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useBazaarStore((s) => s.locale);
  const hydrateLocale = useBazaarStore((s) => s.hydrateLocale);

  useEffect(() => {
    hydrateLocale();
  }, [hydrateLocale]);

  useEffect(() => {
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale === "ne" ? "ne" : "en";
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
