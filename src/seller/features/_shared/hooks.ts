"use client";

// Moved to a shared location so buyer surfaces can reuse it without importing
// across the seller boundary. Re-exported here for existing seller consumers.
export { useIsNarrow } from "@/shared/hooks/use-is-narrow";
