"use client";

import { Suspense } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { BazaarProvider } from "@/providers/bazaar-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <Suspense fallback={null}>
        <BazaarProvider>{children}</BazaarProvider>
      </Suspense>
    </QueryProvider>
  );
}
