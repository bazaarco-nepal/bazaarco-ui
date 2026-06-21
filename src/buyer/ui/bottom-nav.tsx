"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui";

type NavItem = {
  id: string;
  icon: string;
  label: string;
  elevated?: boolean;
  badge?: number;
};

/* Buyer marketplace mobile bottom nav. The center "Watch" item is a raised red
   disc; the cart shows a count badge; the profile slot swaps in the buyer's
   avatar (falling back to the user glyph if the image fails to load). */
export function BuyerBottomNav({
  active,
  onNav,
  cartCount = 0,
  avatarUrl,
}: {
  active: string | null;
  onNav: (screen: string) => void;
  cartCount?: number;
  avatarUrl?: string | null;
}) {
  const { t } = useTranslation();
  const items: NavItem[] = [
    { id: "home", icon: "home", label: t("bottomNav.home") },
    { id: "browse", icon: "grid", label: t("bottomNav.categories") },
    { id: "video", icon: "play", label: t("bottomNav.watch"), elevated: true },
    { id: "bargains", icon: "bargain", label: t("bottomNav.bargain") },
    { id: "profile", icon: "user", label: t("bottomNav.account") },
  ];
  // Fall back to the user icon if the avatar image fails to load (e.g. an
  // expired/blocked Google photo) instead of showing a broken-image glyph.
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);
  return (
    <nav className="bz-bnav" aria-label={t("bottomNav.aria")}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onNav(it.id)}
          aria-current={active === it.id ? "page" : undefined}
          className={`bz-bnav__item${active === it.id ? " bz-bnav__item--active" : ""}${
            it.elevated ? " bz-bnav__item--raised" : ""
          }`}
        >
          {it.elevated ? (
            <span className="bz-bnav__raise">
              <Icon name={it.icon} size={26} fill="currentColor" color="#fff" />
            </span>
          ) : (
            <span className="bz-bnav__ic">
              {it.id === "profile" && avatarUrl && !avatarFailed ? (
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border:
                      active === it.id ? "2px solid var(--blue)" : "2px solid var(--line-200)",
                  }}
                />
              ) : (
                <Icon name={it.icon} size={22} />
              )}
              {it.badge && it.badge > 0 ? (
                <span className="bz-bnav__badge tnum" aria-hidden>
                  {it.badge > 9 ? "9+" : it.badge}
                </span>
              ) : null}
            </span>
          )}
          <span className="bz-bnav__label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
