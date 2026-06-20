"use client";

import { useEffect, useState } from "react";
import { AppLink } from "@/components/ui";
import { searchPath } from "@/config/routes";
import { formatNPR } from "@/lib/money";

// DEBT: hardcoded Flash Sale placeholder data — pending a real flash-sale /
// deals endpoint. Keep this the single source for the section.
type Deal = { name: string; price: number; oldPrice: number; off: string; tint: string };

const FLASH_DEALS: Deal[] = [
  {
    name: "Wireless ANC headphones, 40h",
    price: 2499,
    oldPrice: 3800,
    off: "-34%",
    tint: "#eef2ff",
  },
  {
    name: "Handwoven Dhaka topi, premium",
    price: 690,
    oldPrice: 990,
    off: "-30%",
    tint: "#fff4e8",
  },
  {
    name: "Smartwatch BT calling, AMOLED",
    price: 3199,
    oldPrice: 4500,
    off: "-29%",
    tint: "#eafaf1",
  },
  { name: "Steel vacuum flask, 1L", price: 540, oldPrice: 850, off: "-36%", tint: "#fdecef" },
  { name: "Cotton kurta set, festive", price: 1850, oldPrice: 2600, off: "-29%", tint: "#f3effe" },
  { name: "LED desk lamp, dimmable", price: 1120, oldPrice: 1700, off: "-34%", tint: "#eef7ff" },
];

const DEALS_HREF = searchPath();

function useCountdown(initial = 4 * 3600 + 12 * 60 + 38) {
  const [s, setS] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setS((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

function FlashHead({ clock }: { clock: string }) {
  return (
    <div className="bz-flash__head">
      <span className="bz-flash__title">
        <span className="bz-flash__dot" aria-hidden="true" />
        Flash Sale
      </span>
      <span className="bz-flash__clock tnum">{clock}</span>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <AppLink href={DEALS_HREF} className="bz-deal" ariaLabel={`${deal.name} — ${deal.off}`}>
      <div className="bz-deal__media" style={{ background: deal.tint }}>
        <span className="bz-deal__stripes" aria-hidden="true" />
        <span className="bz-deal__badge tnum">{deal.off}</span>
      </div>
      <div className="bz-deal__body">
        <div className="bz-deal__name">{deal.name}</div>
        <div className="bz-deal__prices">
          <span className="bz-deal__price tnum">{formatNPR(deal.price)}</span>
          <span className="bz-deal__old tnum">{formatNPR(deal.oldPrice)}</span>
        </div>
      </div>
    </AppLink>
  );
}

/* Desktop — compact rail that sits beside the hero. */
export function FlashSaleRail() {
  const clock = useCountdown();
  return (
    <aside className="bz-flash-rail" aria-label="Flash sale">
      <FlashHead clock={clock} />
      <div className="bz-flash-rail__sub">Limited stock · ends today.</div>
      <div className="bz-flash-rail__grid">
        {FLASH_DEALS.slice(0, 4).map((d) => (
          <DealCard key={d.name} deal={d} />
        ))}
      </div>
      <AppLink href={DEALS_HREF} className="bz-flash__all">
        See all deals ›
      </AppLink>
    </aside>
  );
}

/* Mobile — full-width section (placed after categories, per the prototype). */
export function FlashSaleMobile() {
  const clock = useCountdown();
  return (
    <section className="bz-flash-mobile" aria-label="Flash sale">
      <div className="bz-flash-mobile__head">
        <span className="bz-flash__title">
          <span className="bz-flash__dot" aria-hidden="true" />
          Flash Sale
        </span>
        <span className="bz-flash__clock tnum">{clock}</span>
        <AppLink href={DEALS_HREF} className="bz-flash__all bz-flash__all--push">
          All ›
        </AppLink>
      </div>
      <div className="bz-flash-mobile__grid">
        {FLASH_DEALS.slice(0, 4).map((d) => (
          <DealCard key={d.name} deal={d} />
        ))}
      </div>
    </section>
  );
}
