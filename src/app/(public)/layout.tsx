import { MarketplaceShell } from "@/components/layouts/marketplace-shell";
import { MarketplaceScreen } from "@/components/features/marketplace-screen";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketplaceShell>
        <MarketplaceScreen />
      </MarketplaceShell>
      {/* The marketplace shell renders the whole client SPA; the matched route's
          page (product/store) contributes only server-rendered JSON-LD here. */}
      {children}
    </>
  );
}
