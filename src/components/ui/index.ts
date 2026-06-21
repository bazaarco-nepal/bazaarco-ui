// Compatibility bridge — the UI kit moved to @/shared/ui (shared primitives) and
// the BuyerPack/SellerPack surface wrappers to @/buyer/ui and @/seller/ui. This
// barrel keeps the legacy `@/components/ui` import path working until consumers
// are repointed to the design-system trees. Lives outside src/{shared,buyer,
// seller} so it may bridge all three.
export * from "@/shared/ui";
export { BuyerPack } from "@/buyer/ui";
export { SellerPack } from "@/seller/ui";
export { MaintenanceMessage } from "./maintenance-message";
export { LocalErrorBoundary } from "./local-error-boundary";
