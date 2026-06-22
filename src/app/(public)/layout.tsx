import { MarketplaceShell } from "@/components/layouts/marketplace-shell";
import { MarketplaceScreen } from "@/components/features/marketplace-screen";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The matched route's page (product/store JSON-LD, or a null catch-all)
          renders FIRST so its DOM node anchors at the top of the body. On
          navigation Next scrolls that new segment into view; anchored at the
          top it resolves to the top of the page. Placed after the shell it sat
          below the footer, so in prod — where the segment streams in after the
          backend round-trip — Next scrolled the viewport to the bottom. */}
      {children}
      <MarketplaceShell>
        <MarketplaceScreen />
      </MarketplaceShell>
    </>
  );
}
