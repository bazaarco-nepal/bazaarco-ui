import { MarketplaceShell } from "@/components/layouts/marketplace-shell";
import { MarketplaceScreen } from "@/components/features/marketplace-screen";

export default function PublicLayout() {
  return (
    <MarketplaceShell>
      <MarketplaceScreen />
    </MarketplaceShell>
  );
}
