"use client";

import { Suspense } from "react";
import { I18nProvider } from "@/i18n";
import { QueryProvider } from "@/providers/query-provider";
import { BazaarProvider } from "@/providers/bazaar-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <QueryProvider>
        <Suspense fallback={null}>
          <BazaarProvider>{children}</BazaarProvider>
        </Suspense>
      </QueryProvider>
    </I18nProvider>
  );
}
