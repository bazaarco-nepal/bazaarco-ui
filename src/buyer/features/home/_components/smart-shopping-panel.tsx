"use client";

import React from "react";
import { Button, Icon, AppLink } from "@/components/ui";
import { useBz } from "@/components/common";
import { browsePath, pathFromScreen, searchPath, videoPath } from "@/config/routes";
import { useBazaarStore } from "@/store/bazaar-store";
import { useCartQuery } from "@/buyer/hooks/use-cart";
import { useOrders } from "@/buyer/hooks/use-orders";
import { useSavedQuery } from "@/buyer/hooks/use-saved";
import { useBargains } from "@/shared/hooks/use-bargains";
import {
  distinctSellerCount,
  resolveDelivery,
  deliveryTypeLabel,
} from "@/buyer/lib/delivery-options";
import {
  clearRecentActivity,
  readRecentActivity,
  type RecentActivityItem,
} from "@/buyer/lib/recent-activity";
import { formatNPR } from "@/shared/lib/money";
import { bargainExpiryLabel } from "@/shared/lib/bargain-expiry";
import type { BargainOffer } from "@/shared/api/bargains";
import type { Order } from "@/buyer/api/orders";

const ACTIVE_ORDER_STATUSES = new Set([
  "placed",
  "applied",
  "accepted",
  "confirmed",
  "packaging_started",
  "packed",
  "ready_for_pickup",
  "picked_up",
  "arrived_at_hub",
  "out_for_delivery",
  "shipped",
]);

// Guest discovery tiles — a clean 2×2 grid. Every href routes to a real listing
// and needs no login.
const DEAL_TILES = [
  {
    title: "Bargain-ready",
    sub: "Make offers",
    icon: "discount2",
    href: pathFromScreen("bargainable-products"),
  },
  {
    title: "Under Rs. 1,000",
    sub: "Low-risk picks",
    icon: "tag",
    href: searchPath({ price_max: 1000, sort: "price_low" }),
  },
  { title: "Video products", sub: "See before buying", icon: "play", href: videoPath() },
  {
    title: "New arrivals",
    sub: "Fresh products",
    icon: "sparkles",
    href: browsePath({ sort: "newest" }),
  },
];

// Popular search topics under the guest CTA — each query matches live products
// in the catalog (verified against prod), routes to `/search`, and needs no
// login. Spread across the catalog's strongest categories.
const POPULAR_TOPICS = [
  { label: "T-shirts", href: searchPath({ q: "tshirt" }) },
  { label: "Earrings", href: searchPath({ q: "earrings" }) },
  { label: "Tote bags", href: searchPath({ q: "tote bag" }) },
  { label: "Stand fans", href: searchPath({ q: "stand fan" }) },
  { label: "Mixer grinders", href: searchPath({ q: "mixer grinder" }) },
  { label: "Air fryers", href: searchPath({ q: "air fryer" }) },
  { label: "Rice cookers", href: searchPath({ q: "rice cooker" }) },
  { label: "Pressure cookers", href: searchPath({ q: "pressure cooker" }) },
  { label: "Vacuum flasks", href: searchPath({ q: "vacuum flask" }) },
  { label: "Home theaters", href: searchPath({ q: "home theater" }) },
];

type QuickAction = { label: string; href?: string; onClick?: () => void };

function useRecentActivity() {
  const [items, setItems] = React.useState<RecentActivityItem[]>([]);

  React.useEffect(() => {
    const refresh = () => setItems(readRecentActivity());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("bz:recent-activity", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("bz:recent-activity", refresh);
    };
  }, []);

  return items;
}

function itemCountLabel(count: number) {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? "item" : "items"}`;
}

function cartTotal(cart: { price: number; qty: number }[]) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function isActiveOrder(order: Order) {
  return ACTIVE_ORDER_STATUSES.has(order.status);
}

function orderStatusLabel(status: string) {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function offerUrgency(offer: BargainOffer) {
  const expiresAt = offer.expires ? new Date(offer.expires).getTime() : Number.POSITIVE_INFINITY;
  const expiringSoon = expiresAt > Date.now() && expiresAt - Date.now() <= 2 * 60 * 60 * 1000;
  if (offer.status === "accepted") return 1;
  if (offer.status === "countered") return 2;
  if ((offer.status === "pending" || offer.status === "countered") && expiringSoon) return 3;
  return 99;
}

function pickBargainAction(offers: BargainOffer[]) {
  const actionable = offers
    .filter((offer) => {
      const priority = offerUrgency(offer);
      if (priority === 99) return false;
      if (!offer.expires) return true;
      return new Date(offer.expires).getTime() > Date.now();
    })
    .sort((a, b) => offerUrgency(a) - offerUrgency(b));

  return { offer: actionable[0] ?? null, moreCount: Math.max(actionable.length - 1, 0) };
}

/* ---------------------------------------------------------------------------
   Shared SmartPanel primitives. Every panel state composes from these — no
   per-state title styling, no one-off layout. Content flows top-to-bottom at
   the panel's own gap; the card is content-height and sits at the top of the
   hero slot, so it never stretches into a half-empty box.
--------------------------------------------------------------------------- */
function SmartPanel({
  label,
  fill,
  busy,
  children,
}: {
  label: string;
  fill?: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={`bz-smart-panel${fill ? " bz-smart-panel--fill" : ""}`}
      aria-label={label}
      aria-busy={busy || undefined}
    >
      {children}
    </aside>
  );
}

function SmartPanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bz-smart-panel__header">
      <h2 className="bz-smart-panel__title">{title}</h2>
      {subtitle ? <p className="bz-smart-panel__subtitle">{subtitle}</p> : null}
    </div>
  );
}

function SmartPanelLeadCard({
  icon,
  thumb,
  tone,
  title,
  children,
}: {
  icon: string;
  thumb?: string;
  tone?: "bargain";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bz-smart-lead${tone === "bargain" ? " bz-smart-lead--bargain" : ""}`}>
      {thumb ? (
        <img className="bz-smart-lead__thumb" src={thumb} alt="" loading="lazy" />
      ) : (
        <span className="bz-smart-lead__icon" aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
      )}
      <div className="bz-smart-lead__body">
        <h3 className="bz-smart-lead__title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function SmartPanelTileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="bz-smart-tiles" aria-label="Shopping shortcuts">
      {children}
    </div>
  );
}

function SmartPanelTile({
  icon,
  title,
  sub,
  href,
}: {
  icon: string;
  title: string;
  sub: string;
  href: string;
}) {
  return (
    <AppLink href={href} className="bz-smart-tile">
      <span className="bz-smart-tile__chip" aria-hidden="true">
        <Icon name={icon} size={17} />
      </span>
      <span className="bz-smart-tile__text">
        <span className="bz-smart-tile__title">{title}</span>
        <span className="bz-smart-tile__sub">{sub}</span>
      </span>
    </AppLink>
  );
}

function SmartPanelMetricRow({ metrics }: { metrics: { value: string; label: string }[] }) {
  return (
    <div
      className="bz-smart-metrics"
      style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="bz-smart-metric">
          <span className="bz-smart-metric__value tnum">{metric.value}</span>
          <span className="bz-smart-metric__label">{metric.label}</span>
        </div>
      ))}
    </div>
  );
}

function SmartPanelTopics({
  label,
  topics,
}: {
  label: string;
  topics: { label: string; href: string }[];
}) {
  return (
    <div className="bz-smart-topics-group">
      <span className="bz-smart-quick__label">{label}</span>
      <div className="bz-smart-topics" aria-label={label}>
        {topics.map((topic) => (
          <AppLink key={topic.label} href={topic.href} className="bz-smart-topic">
            {topic.label}
          </AppLink>
        ))}
      </div>
    </div>
  );
}

function SmartPanelQuickLinks({ label, actions }: { label?: string; actions: QuickAction[] }) {
  return (
    <div className="bz-smart-quick-group">
      {label ? <span className="bz-smart-quick__label">{label}</span> : null}
      <div className="bz-smart-quick" aria-label={label ?? "Quick links"}>
        {actions.map((action) =>
          action.href ? (
            <AppLink key={action.label} href={action.href}>
              {action.label}
            </AppLink>
          ) : (
            <button key={action.label} type="button" onClick={action.onClick}>
              {action.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <SmartPanel label="Smart shopping panel" busy>
      <div className="bz-smart-skel bz-smart-skel--title" />
      <div className="bz-smart-skel bz-smart-skel--line" />
      <div className="bz-smart-skel bz-smart-skel--lead" />
      <div className="bz-smart-skel-row">
        <span />
        <span />
        <span />
      </div>
      <div className="bz-smart-skel bz-smart-skel--cta" />
    </SmartPanel>
  );
}

function FindYourDealPanel() {
  return (
    <SmartPanel label="Find your deal" fill>
      <SmartPanelHeader
        title="Find your deal"
        subtitle="Browse first. Login only when you bargain, save, or checkout."
      />
      <SmartPanelTileGrid>
        {DEAL_TILES.map((tile) => (
          <SmartPanelTile key={tile.title} {...tile} />
        ))}
      </SmartPanelTileGrid>
      <SmartPanelTopics label="Popular searches" topics={POPULAR_TOPICS} />
      <Button
        variant="primary"
        size="md"
        full
        href={browsePath({ sort: "newest" })}
        iconRight="arrowRight"
      >
        Explore deals
      </Button>
    </SmartPanel>
  );
}

function CartPanel({ authenticated, savedCount }: { authenticated: boolean; savedCount: number }) {
  const cart = useBazaarStore((s) => s.cart);
  const items = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cartTotal(cart);
  const sellers = distinctSellerCount(cart);
  const delivery = resolveDelivery(cart, "standard");
  const title = authenticated ? "Your next move" : "Your cart is waiting";

  const metrics = [
    { value: items.toLocaleString("en-IN"), label: items === 1 ? "Item" : "Items" },
    { value: formatNPR(total), label: "Cart total" },
  ];
  if (savedCount > 0) {
    metrics.push({ value: savedCount.toLocaleString("en-IN"), label: "Saved" });
  }

  const meta = [
    sellers >= 2 ? `${sellers} sellers` : null,
    delivery.combined ? "Combined delivery available" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const quickActions: QuickAction[] = authenticated
    ? [
        { label: "View cart", href: pathFromScreen("cart") },
        { label: "Saved", href: pathFromScreen("saved") },
        { label: "Orders", href: pathFromScreen("orders") },
        { label: "Bargains", href: pathFromScreen("bargainable-products") },
      ]
    : [
        { label: "Keep shopping", href: browsePath() },
        { label: "Bargains", href: pathFromScreen("bargainable-products") },
      ];

  return (
    <SmartPanel label={title}>
      <SmartPanelHeader
        title={title}
        subtitle={authenticated ? undefined : "Browse first. Login when you check out."}
      />
      <SmartPanelLeadCard icon="cart" title={authenticated ? "Ready to checkout?" : title}>
        <p className="bz-smart-lead__line">
          {itemCountLabel(items)} · {formatNPR(total)}
        </p>
        {meta ? <span className="bz-smart-lead__meta">{meta}</span> : null}
      </SmartPanelLeadCard>
      <SmartPanelMetricRow metrics={metrics} />
      <Button
        variant="primary"
        size="md"
        full
        href={authenticated ? pathFromScreen("checkout") : pathFromScreen("cart")}
        iconRight="arrowRight"
      >
        {authenticated ? "Checkout" : "View cart"}
      </Button>
      <SmartPanelQuickLinks actions={quickActions} />
      {authenticated ? null : (
        <p className="bz-smart-panel__helper">Login later to save, bargain, or checkout.</p>
      )}
    </SmartPanel>
  );
}

function BargainActionPanel({ offer, moreCount }: { offer: BargainOffer; moreCount: number }) {
  const { addToCart, nav } = useBz();
  const accepted = offer.status === "accepted";
  const countered = offer.status === "countered";
  const expires = bargainExpiryLabel(offer.expires);
  const agreed = offer.agreed ?? offer.sellerCounter ?? offer.yourOffer;
  const title = accepted ? "Deal accepted" : countered ? "Seller replied" : "Bargain waiting";
  const cta = accepted ? "Checkout now" : countered ? "View bargain" : "Respond now";

  return (
    <SmartPanel label="Your next move">
      <SmartPanelHeader title="Your next move" />
      <SmartPanelLeadCard
        tone="bargain"
        icon="discount2"
        thumb={offer.p.img ?? undefined}
        title={title}
      >
        <p className="bz-smart-lead__line">{offer.p.name}</p>
        <span className="bz-smart-lead__meta">
          You offered {formatNPR(offer.yourOffer)}
          {offer.sellerCounter ? ` · Seller ${formatNPR(offer.sellerCounter)}` : ""}
          {accepted ? ` · Agreed ${formatNPR(agreed)}` : ""}
        </span>
        {expires ? <span className="bz-smart-lead__meta">{expires}</span> : null}
        {moreCount > 0 ? (
          <span className="bz-smart-lead__meta">+{moreCount} more waiting</span>
        ) : null}
      </SmartPanelLeadCard>
      <Button
        variant={accepted ? "primary" : "bargain"}
        size="md"
        full
        iconRight="arrowRight"
        onClick={async () => {
          if (accepted) {
            await addToCart(
              offer.p,
              1,
              `Added at bargained price · ${formatNPR(agreed)}`,
              offer.variantId,
            );
            nav("checkout");
            return;
          }
          nav("bargains");
        }}
      >
        {cta}
      </Button>
      <SmartPanelQuickLinks
        actions={[
          { label: "All bargains", href: pathFromScreen("bargains") },
          { label: "Saved", href: pathFromScreen("saved") },
          { label: "Cart", href: pathFromScreen("cart") },
        ]}
      />
    </SmartPanel>
  );
}

function TrackOrderPanel({ order }: { order: Order }) {
  return (
    <SmartPanel label="Your next move">
      <SmartPanelHeader title="Your next move" />
      <SmartPanelLeadCard icon="truck" title="Track your order">
        <p className="bz-smart-lead__line">
          {orderStatusLabel(order.status)} · #{order.id.slice(0, 8)}
        </p>
        {order.deliveryType ? (
          <span className="bz-smart-lead__meta">{deliveryTypeLabel(order.deliveryType)}</span>
        ) : null}
      </SmartPanelLeadCard>
      <Button
        variant="primary"
        size="md"
        full
        href={pathFromScreen("tracking", undefined, undefined, order.id)}
        iconRight="arrowRight"
      >
        Track order
      </Button>
      <SmartPanelQuickLinks
        actions={[
          { label: "Orders", href: pathFromScreen("orders") },
          { label: "Saved", href: pathFromScreen("saved") },
          { label: "Bargains", href: pathFromScreen("bargains") },
        ]}
      />
    </SmartPanel>
  );
}

function ContinueShoppingPanel({ savedCount }: { savedCount: number }) {
  return (
    <SmartPanel label="Your next move">
      <SmartPanelHeader title="Your next move" />
      <SmartPanelLeadCard icon="heart" title="Continue shopping">
        <p className="bz-smart-lead__line">
          {savedCount > 0
            ? `${savedCount.toLocaleString("en-IN")} saved ${savedCount === 1 ? "item" : "items"}`
            : "Pick up where you left off."}
        </p>
      </SmartPanelLeadCard>
      <Button
        variant="primary"
        size="md"
        full
        href={pathFromScreen("saved")}
        iconRight="arrowRight"
      >
        Open saved
      </Button>
      <SmartPanelQuickLinks
        actions={[
          { label: "Bargains", href: pathFromScreen("bargainable-products") },
          { label: "New arrivals", href: browsePath({ sort: "newest" }) },
          { label: "Orders", href: pathFromScreen("orders") },
          { label: "Browse all", href: browsePath() },
        ]}
      />
    </SmartPanel>
  );
}

function ContinueBrowsingPanel({ authenticated }: { authenticated: boolean }) {
  const recents = useRecentActivity().slice(0, 3);
  const first = recents[0];

  return (
    <SmartPanel label={authenticated ? "Your next move" : "Continue browsing"}>
      <SmartPanelHeader title={authenticated ? "Your next move" : "Continue browsing"} />
      <SmartPanelLeadCard
        icon="search"
        title={authenticated ? "Continue shopping" : "Continue browsing"}
      >
        <p className="bz-smart-lead__line">{recents.map((item) => item.label).join(" · ")}</p>
      </SmartPanelLeadCard>
      <Button
        variant="primary"
        size="md"
        full
        href={first?.href ?? searchPath()}
        iconRight="arrowRight"
      >
        Continue
      </Button>
      <SmartPanelQuickLinks
        actions={[
          { label: "New arrivals", href: browsePath({ sort: "newest" }) },
          { label: "Bargains", href: pathFromScreen("bargainable-products") },
          { label: "Start fresh", onClick: clearRecentActivity },
        ]}
      />
      {!authenticated ? (
        <p className="bz-smart-panel__helper">Login later to save across devices.</p>
      ) : null}
    </SmartPanel>
  );
}

export function SmartShoppingPanel() {
  const authed = useBazaarStore((s) => s.authed);
  const authReady = useBazaarStore((s) => s.authReady);
  const cart = useBazaarStore((s) => s.cart);
  const recents = useRecentActivity();
  const cartQuery = useCartQuery(authed);
  const bargainsQuery = useBargains(authed);
  const ordersQuery = useOrders(authed);
  const savedQuery = useSavedQuery(authed);

  const cartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const { offer, moreCount } = pickBargainAction(bargainsQuery.data ?? []);
  const activeOrder = (ordersQuery.data ?? []).find(isActiveOrder) ?? null;
  const savedCount = savedQuery.data?.productIds.length ?? 0;
  const isLoading =
    !authReady ||
    (authed &&
      ((cartQuery.isLoading && cart.length === 0) ||
        bargainsQuery.isLoading ||
        ordersQuery.isLoading ||
        savedQuery.isLoading));

  if (isLoading) return <PanelSkeleton />;

  if (!authed) {
    if (cartItems > 0) return <CartPanel authenticated={false} savedCount={savedCount} />;
    if (recents.length > 0) return <ContinueBrowsingPanel authenticated={false} />;
    return <FindYourDealPanel />;
  }

  if (offer && !bargainsQuery.isError)
    return <BargainActionPanel offer={offer} moreCount={moreCount} />;
  if (cartItems > 0 && !cartQuery.isError)
    return <CartPanel authenticated savedCount={savedCount} />;
  if (activeOrder && !ordersQuery.isError) return <TrackOrderPanel order={activeOrder} />;
  if ((savedCount > 0 || recents.length > 0) && !savedQuery.isError) {
    if (savedCount > 0) return <ContinueShoppingPanel savedCount={savedCount} />;
    return <ContinueBrowsingPanel authenticated />;
  }

  return <FindYourDealPanel />;
}
