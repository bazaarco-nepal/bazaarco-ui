"use client";

import { QueryProvider } from "@/providers/query-provider";
import { BazaarProvider } from "@/providers/bazaar-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <BazaarProvider>{children}</BazaarProvider>
    </QueryProvider>
  );
}
