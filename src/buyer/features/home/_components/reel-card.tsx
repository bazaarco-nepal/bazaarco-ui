"use client";

import { Icon, AppLink } from "@/components/ui";
import { formatNPR } from "@/shared/lib/money";
import type { VideoFeedItem } from "@/types/video";

// Dark backdrops sit behind the reel video, mirroring the prototype's reel tints.
// Used only when a reel has no thumbnail/cover to fill the card.
const REEL_BACKDROP: Record<string, string> = {
  blue: "#22304f",
  slate: "#1d2c44",
  red: "#3a2230",
  purple: "#2a2440",
  green: "#1f3328",
  teal: "#1f3326",
  gold: "#352a18",
  saffron: "#3a2436",
};

function formatViews(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function ReelCard({
  reel,
  href,
  onNavigate,
}: {
  reel: VideoFeedItem;
  href: string;
  onNavigate?: () => void;
}) {
  const cover = reel.videoThumb ?? reel.img;
  const seller = reel.seller;
  const initial = (seller?.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <AppLink
      href={href}
      onNavigate={onNavigate}
      className="bz-reel-card"
      style={{ background: REEL_BACKDROP[reel.tint] ?? "#22304f" }}
      ariaLabel={`Watch ${reel.name}`}
    >
      {cover ? (
        <img src={cover} alt="" className="bz-reel-card__img" />
      ) : (
        <span aria-hidden className="bz-reel-card__weave" />
      )}
      <span aria-hidden className="bz-reel-card__scrim" />

      <div className="bz-reel-card__top">
        <span className="bz-reel-card__avatar">
          {seller?.avatar ? <img src={seller.avatar} alt="" /> : initial}
        </span>
        <span className="bz-reel-card__handle">{seller?.name}</span>
        <span className="bz-reel-card__views">
          <Icon name="play" size={9} color="#fff" fill="#fff" />
          {formatViews(reel.engagement.views)}
        </span>
      </div>

      <span aria-hidden className="bz-reel-card__play">
        <Icon name="play" size={18} color="#fff" fill="#fff" />
      </span>

      <div className="bz-reel-card__bottom">
        <div className="bz-reel-card__pill">
          <span className="bz-reel-card__pill-icon">
            <Icon name="tag" size={14} />
          </span>
          <span className="bz-reel-card__pill-name">{reel.name}</span>
          <span className="bz-reel-card__price">{formatNPR(reel.price)}</span>
        </div>
      </div>
    </AppLink>
  );
}
