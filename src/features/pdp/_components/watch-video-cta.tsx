"use client";

import { Icon, AppLink } from "@/components/ui";
import { videoPath } from "@/config/routes";

type PdpWatchVideoCtaProps = {
  productId: string;
  thumb?: string | null;
};

export function PdpWatchVideoCta({ productId, thumb }: PdpWatchVideoCtaProps) {
  return (
    <AppLink
      href={videoPath(productId)}
      className="bz-pdp-watch-video"
      aria-label="Watch video of this product"
    >
      <span className="bz-pdp-watch-video__thumb">
        {thumb ? <img src={thumb} alt="" /> : <span className="bz-pdp-watch-video__fallback" />}
        <span className="bz-pdp-watch-video__play" aria-hidden>
          <span className="bz-pdp-watch-video__play-badge">
            <Icon name="play" size={8} color="var(--red)" fill="var(--red)" />
          </span>
        </span>
      </span>
      <span className="bz-pdp-watch-video__text">Watch video</span>
    </AppLink>
  );
}
