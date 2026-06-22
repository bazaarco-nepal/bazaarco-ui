"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  Chip,
  StatusPill,
  SkeletonCard,
  EmptyState,
  QtyStepper,
  SectionHead,
  AllInPriceCard,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  LandmarkAddress,
  usePages,
  LoadMore,
  BackToTop,
  ApiState,
  AppLink,
  StoreAvatar,
  RowLimitedGrid,
  LocalErrorBoundary,
} from "@/components/ui";
import { browsePath, pathFromScreen, videoPath } from "@/config/routes";
import { ASSETS } from "@/config/assets";
import { useHome } from "@/buyer/hooks/use-home";
import { useHomeExploreFeed } from "@/buyer/hooks/use-home-explore";
import { useGridColumns } from "@/shared/hooks/use-visible-by-rows";
import { useVideoFeed } from "@/buyer/hooks/use-video-feed";
import { useBargainableProducts } from "@/shared/hooks/use-catalog";
import { useBazaarStore } from "@/store/bazaar-store";
import {
  BazaarCtx,
  useBz,
  ProductCard,
  BargainProductCard,
  CategoryTile,
  Navbar,
  Footer,
} from "@/components/common";
import { PicksSections } from "./_components/picks-tabs";
import type { VideoFeedItem } from "@/types/video";
// Temporarily hidden alongside the Smart Shopping panel — restore with the hero blocks below.
// import { HomeHero } from "./_components/home-hero";
import { NewArrivalsSection } from "./_components/new-arrivals";
// Temporarily hidden — restore alongside the slot in the desktop hero below.
// import { SmartShoppingPanel } from "./_components/smart-shopping-panel";
import { ReelCard } from "./_components/reel-card";
import type { PopularStore } from "@/buyer/api/home";

const WATCH_RAIL_LIMIT = 8;

function WatchSection({ reels }: { reels: VideoFeedItem[] }) {
  return (
    <section className="bz-watch-rail">
      <div className="bz-watch-rail__head">
        <span className="bz-watch-rail__badge" aria-hidden="true">
          <Icon name="play" size={15} color="#fff" />
        </span>
        <span className="bz-watch-rail__title">BazaarCo Watch</span>
        <Button
          variant="link"
          className="bz-watch-rail__feed"
          href={pathFromScreen("video")}
          iconRight="arrowRight"
          style={{ marginLeft: "auto" }}
        >
          Open the feed
        </Button>
      </div>
      <div className="bz-watch-rail__scroll no-scrollbar">
        {reels.map((reel) => (
          <div key={reel.id} className="bz-watch-rail__item">
            <ReelCard reel={reel} href={videoPath(reel.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BargainSection() {
  const { t } = useTranslation();
  const { openProduct } = useBz();
  const { data, isLoading } = useBargainableProducts(24);
  const products = data?.items ?? [];

  return (
    <div className="bz-bargain-panel">
      <div className="bz-sec-head bz-bargain-head">
        <div>
          <h2 className="bz-sec-head__title" style={{ margin: 0 }}>
            Bargain with the seller
          </h2>
          <p className="bz-bargain-head__note">{t("home.bargainReassurance")}</p>
        </div>
        <AppLink href={pathFromScreen("bargainable-products")} className="bz-sec-head__action">
          <span className="bz-hide-mobile">All bargainable products</span>
          <span className="bz-show-mobile">All</span>
          <Icon name="arrowRight" size={16} />
        </AppLink>
      </div>
      {isLoading && products.length === 0 ? (
        <div className="bz-bargain-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <RowLimitedGrid
          className="bz-bargain-grid"
          items={products}
          maxRows={2}
          renderItem={(product) => (
            <BargainProductCard
              key={product.id}
              p={product}
              onOpen={openProduct}
              onOffer={(prod) => openProduct(prod, { offer: true })}
            />
          )}
        />
      ) : (
        <div className="bz-bargain-empty">
          <span>No negotiable products yet.</span>
          <Button variant="link" href={browsePath()} iconRight="arrowRight">
            Browse products
          </Button>
        </div>
      )}
    </div>
  );
}

function PopularStoresSection({ stores }: { stores: PopularStore[] }) {
  const { t } = useTranslation();
  const { nav, openStore } = useBz();
  if (stores.length === 0) return null;

  return (
    <div className="bz-hide-mobile bz-popular-stores">
      <SectionHead
        title={t("home.popularStores")}
        action={t("home.viewAllStores")}
        actionHref={pathFromScreen("stores")}
      />
      <RowLimitedGrid
        className="bz-popular-stores__grid"
        items={stores}
        maxRows={1}
        renderItem={(store) => (
          <div
            key={store.id}
            role="link"
            tabIndex={0}
            className="bz-popular-store-card"
            aria-label={t("stores.visitStoreAria", { name: store.name })}
            onClick={() => openStore(store.slug || store.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openStore(store.slug || store.id);
              }
            }}
          >
            <div className="bz-popular-store-card__body">
              <div className="bz-popular-store-card__head">
                <StoreAvatar src={store.avatar} name={store.name} size={44} />
                <div className="bz-popular-store-card__identity">
                  <div className="bz-popular-store-card__name">
                    {store.name}
                    {store.verified ? (
                      <Icon name="badgeCheck" size={15} color="var(--blue)" />
                    ) : null}
                  </div>
                  <div className="bz-popular-store-card__handle">@{store.slug || store.id}</div>
                </div>
                {store.reviews > 0 ? (
                  <span className="bz-popular-store-card__rating">
                    <Icon name="star" size={14} color="#8a6a12" fill="#8a6a12" />
                    <span className="tnum">{store.rating.toFixed(1)}</span>
                  </span>
                ) : null}
              </div>
              <div className="bz-popular-store-card__products" aria-hidden="true">
                {[0, 1, 2].map((index) => {
                  const image = store.productImages[index];
                  const moreCount = Math.max(store.productCount - 3, 0);
                  return (
                    <div key={index} className="bz-popular-store-card__product">
                      {image ? <img src={image} alt="" loading="lazy" /> : null}
                      {index === 2 && moreCount > 0 ? (
                        <span className="bz-popular-store-card__more">
                          +{moreCount.toLocaleString("en-IN")}
                          <br />
                          {t("home.more")}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="bz-popular-store-card__actions">
                <Button
                  variant="primary"
                  size="sm"
                  icon="play"
                  className="bz-popular-store-card__action--grow"
                  onClick={(event) => {
                    event.stopPropagation();
                    nav("video");
                  }}
                >
                  {t("home.watchFeed")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bz-popular-store-card__action--grow"
                  onClick={(event) => {
                    event.stopPropagation();
                    openStore(store.slug || store.id);
                  }}
                >
                  {t("home.visit")}
                </Button>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

export function Home() {
  const { t } = useTranslation();
  const { nav, openProduct } = useBz();
  const { data: homeData, isLoading: homeLoading, isError: homeError, error: homeErr } = useHome();
  const exploreFeed = useHomeExploreFeed(homeData?.explore);
  const loading = homeLoading;
  const isError = homeError;
  const error = homeErr;
  const categories = homeData?.categories;
  const newArrivalItems = homeData?.newArrivals?.items ?? [];
  const newArrivalTotal = homeData?.newArrivals?.total ?? newArrivalItems.length;
  const popularStores = homeData?.popularStores ?? [];

  const { data: videoFeed } = useVideoFeed();
  const watchReels = React.useMemo(
    () =>
      (videoFeed?.items ?? [])
        .filter((v) => typeof v.videoUrl === "string" && v.videoUrl.trim().length > 0)
        .map((reel, apiIndex) => ({
          reel,
          apiIndex,
          uploadedAt: Date.parse(reel.uploadedAt),
        }))
        .sort((a, b) => {
          const aHasDate = Number.isFinite(a.uploadedAt);
          const bHasDate = Number.isFinite(b.uploadedAt);
          if (aHasDate && bHasDate && a.uploadedAt !== b.uploadedAt) {
            return b.uploadedAt - a.uploadedAt;
          }
          if (aHasDate !== bHasDate) return bHasDate ? 1 : -1;
          return a.apiIndex - b.apiIndex;
        })
        .map(({ reel }) => reel)
        .slice(0, WATCH_RAIL_LIMIT),
    [videoFeed],
  );

  // "Recommended for you" is an auto-fill grid whose column count shifts with
  // width/zoom (7-up at 100%, 6-up at 125%, …), so a fixed page size can't keep
  // the last row full. Render only whole rows while more can load — the trailing
  // partial row is hidden until the next page fills it — and show everything once
  // the feed is exhausted, so no product is ever skipped.
  const picksGridRef = React.useRef<HTMLDivElement>(null);
  const exploreCols = useGridColumns(picksGridRef);
  const exploreWholeRows = Math.floor(exploreFeed.items.length / exploreCols) * exploreCols;
  const exploreVisibleCount =
    exploreFeed.hasNextPage && exploreWholeRows > 0 ? exploreWholeRows : exploreFeed.items.length;

  const W = ({
    children,
    style,
    className,
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }) => (
    <section className={`container${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </section>
  );
  // Full-bleed featured band: the navy/cream floor spans the viewport while the
  // content stays inside the centered .container. Only the two signature
  // sections (Watch, Bargain) use it — see --band-*-bg.
  const Band = ({
    variant,
    children,
  }: {
    variant: "watch" | "bargain";
    children?: React.ReactNode;
  }) => (
    <section className={`bz-band bz-band--${variant}`}>
      <div className="container">{children}</div>
    </section>
  );
  // The static shell (hero, mobile header, category frame, banners) needs no API
  // data, so it paints immediately — no full-page spinner. Only the data-backed
  // sections (categories, picks, feed) show their own skeletons while loading.
  const catalogLoading = homeLoading && !categories;
  return (
    <>
      {/* bz-home--no-hero adds the top breathing room the hero used to carry;
          drop that class when the hero blocks below are restored. */}
      <div className="bz-home bz-home--no-hero">
        <BackToTop />
        {/* Hero carousel + Smart Shopping panel temporarily hidden. To restore,
            un-comment this desktop block, the mobile hero block below, and the
            HomeHero / SmartShoppingPanel imports. Original layout is preserved:
            hero on the left, Smart Shopping panel on the right.

        <div className="bz-hide-mobile">
          <W className="bz-home-hero" style={{ paddingTop: 22 }}>
            <div className="bz-home-herorow">
              <HomeHero />
              <div className="bz-home-smart-slot">
                <SmartShoppingPanel />
              </div>
            </div>
          </W>
        </div>
        */}

        {/* Mobile hero placement (under the header, above categories) — hidden too.

        <div className="bz-show-mobile">
          <W style={{ paddingTop: 14 }}>
            <HomeHero />
          </W>
        </div>
        */}

        {/* Shop by categories — bordered card tiles (revamp). */}
        <W className="bz-home-section bz-home-categories">
          <SectionHead
            title={t("home.shopByCategory")}
            action={t("home.allCategories")}
            actionHref={browsePath({ view: "categories" })}
          />
          <div className="bz-homecat-grid">
            {catalogLoading && !categories
              ? Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="bz-cat__card" aria-hidden="true">
                    <div className="bz-cat__card-thumb skel" />
                    <span className="bz-cat__card-label">
                      <span className="skel" style={{ width: 54, height: 10, borderRadius: 6 }} />
                    </span>
                  </div>
                ))
              : (categories ?? []).map((c) => (
                  <CategoryTile
                    key={c.id}
                    c={c}
                    variant="card"
                    href={browsePath({ cat: c.id })}
                    onClick={() => nav("browse", { cat: c.id })}
                    shortOnMobile
                  />
                ))}
          </div>
        </W>

        <LocalErrorBoundary label="home-picks">
          <PicksSections topPicks={homeData?.topPicks} homeLoading={homeLoading} />
        </LocalErrorBoundary>

        {/* Featured zones — the only two sections on a full-bleed tinted band. */}
        {watchReels.length > 0 && (
          <Band variant="watch">
            <LocalErrorBoundary label="home-watch">
              <WatchSection reels={watchReels} />
            </LocalErrorBoundary>
          </Band>
        )}

        <Band variant="bargain">
          <LocalErrorBoundary label="home-bargain">
            <BargainSection />
          </LocalErrorBoundary>
        </Band>

        {(homeLoading || newArrivalItems.length > 0) && (
          <W className="bz-home-section">
            <LocalErrorBoundary label="home-new-arrivals">
              <NewArrivalsSection
                products={newArrivalItems}
                total={newArrivalTotal}
                loading={homeLoading}
              />
            </LocalErrorBoundary>
          </W>
        )}

        {/* Endless product feed — shown on both web and mobile */}
        <W className="bz-home-section">
          <SectionHead title={t("home.recommendedForYou")} />
          {isError && !homeLoading ? (
            <EmptyState
              title={t("home.loadError")}
              message={t("home.loadErrorMessage")}
              cta={t("common.reload")}
              onCta={() => window.location.reload()}
            />
          ) : (
            <>
              <div className="bz-picks-grid" ref={picksGridRef}>
                {homeLoading && exploreFeed.items.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : exploreFeed.items
                      .slice(0, exploreVisibleCount)
                      .map((p) => <ProductCard key={p.id} p={p} onClick={openProduct} />)}
              </div>
              {!homeLoading && exploreFeed.total > 0 && (
                <LoadMore
                  paged={{
                    visible: exploreFeed.items,
                    shown: exploreFeed.items.length,
                    total: exploreFeed.total,
                    pageSize: exploreFeed.pageSize,
                    hasMore: exploreFeed.hasNextPage,
                    nextBatch: Math.min(
                      exploreFeed.pageSize,
                      Math.max(0, exploreFeed.total - exploreFeed.items.length),
                    ),
                    page: exploreFeed.page,
                    pageCount: Math.max(1, exploreFeed.totalPages),
                    more: () => {
                      void exploreFeed.loadMore();
                    },
                    goPage: () => {},
                    reset: () => {},
                  }}
                  noun="products"
                  size="sm"
                  style={{ paddingBottom: 12 }}
                />
              )}
            </>
          )}
        </W>

        {popularStores.length > 0 && (
          <W className="bz-home-section bz-hide-mobile">
            <PopularStoresSection stores={popularStores} />
          </W>
        )}
      </div>
    </>
  );
}
