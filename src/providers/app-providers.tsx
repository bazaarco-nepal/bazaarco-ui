"use client";

import { Suspense } from "react";
import { I18nProvider } from "@/i18n";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/shared/providers/session-provider";
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
        <SessionProvider>
          <Suspense fallback={null}>
            <BazaarProvider>{children}</BazaarProvider>
          </Suspense>
        </SessionProvider>
      </QueryProvider>
    </I18nProvider>
  );
}
