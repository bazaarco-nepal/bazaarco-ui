"use client";

import { Suspense } from "react";
import { I18nProvider } from "@/i18n";
import { QueryProvider } from "@/providers/query-provider";
import { BazaarProvider } from "@/providers/bazaar-provider";
import type { Locale } from "@/i18n/locale-constants";

export function AppProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <QueryProvider>
        <Suspense fallback={null}>
          <BazaarProvider>{children}</BazaarProvider>
        </Suspense>
      </QueryProvider>
    </I18nProvider>
  );
}
