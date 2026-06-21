"use client";

import { useTranslation } from "react-i18next";
import { SellerIcon } from "@/seller/ui/icons";

/* Seller console mobile bottom nav. Lives outside the seller shell, so it opts
   into the Fluent skin itself (data-skin="fluent") — that re-points the accent
   to blue and swaps in Segoe UI to match the rest of the console. The "__menu"
   item opens the seller drawer via the `bz-seller-menu` window event. */
export function SellerBottomNav({
  active,
  onNav,
}: {
  active: string | null;
  onNav: (screen: string) => void;
}) {
  const { t } = useTranslation();
  const items = [
    { id: "s-dashboard", icon: "home", label: t("bottomNav.home") },
    { id: "s-inbox", icon: "package", label: t("bottomNav.orders") },
    { id: "s-add", icon: "plus", label: t("bottomNav.add") },
    { id: "s-bargain", icon: "bargain", label: t("bottomNav.bargain") },
    { id: "__menu", icon: "menu", label: t("bottomNav.more") },
  ];
  return (
    <nav className="bz-bnav" data-skin="fluent" aria-label={t("bottomNav.aria")}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => {
            if (it.id === "__menu") {
              window.dispatchEvent(new CustomEvent("bz-seller-menu"));
              return;
            }
            onNav(it.id);
          }}
          aria-current={active === it.id ? "page" : undefined}
          className={`bz-bnav__item${active === it.id ? " bz-bnav__item--active" : ""}`}
        >
          <span className="bz-bnav__ic">
            <SellerIcon name={it.icon} size={22} filled={active === it.id} />
          </span>
          <span className="bz-bnav__label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
