'use client';


import React, { useState, useEffect } from "react";
import { Icon, Logo, Button, Spinner, IconButton, RatingStars, Chip, VerifiedBadge, StatusPill, Price, Placeholder, VideoPlayer, SkeletonCard, EmptyState, QtyStepper, Toast, SectionHead, TINTS, HelpLifeline, AllInPriceCard, OTPInput, MenuRow, ChipGroup, MobileBuyBar, BottomNav, LandmarkAddress, VoiceMicButton, usePaged, usePages, LoadMore, PageBar, BackToTop, ApiState } from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useHome } from "@/hooks/use-home";
import { BazaarCtx, useBz, Himalaya, KathmanduSkyline, ProductCard, ProductRail, CategoryTile, Navbar, Footer, DevViewSwitcher } from "@/components/common";



function Countdown({ initial = 3 * 3600 + 42 * 60 + 9 }) {
  const [s, setS] = useState(initial);
  useEffect(() => { const id = setInterval(() => setS(x => (x > 0 ? x - 1 : 0)), 1000); return () => clearInterval(id); }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const Box = ({ v }) => <span className="tnum" style={{ background: "var(--ink-900)", color: "#fff", borderRadius: "var(--r-sm)",
    padding: "4px 8px", fontWeight: 800, fontSize: "1rem", minWidth: 34, textAlign: "center", display: "inline-block" }}>{v}</span>;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
    <Box v={hh} /><span style={{ color: "#fff", fontWeight: 800 }}>:</span><Box v={mm} /><span style={{ color: "#fff", fontWeight: 800 }}>:</span><Box v={ss} /></span>;
}

const HERO_SLIDES_FALLBACK = [
  { eyebrow: "Festive Sale",       title: "Up to 50% off —",      accent: "shop the season",  sub: "Handpicked deals from verified Nepali sellers. Bargain freely, no hidden fees.", icon: "gift",    tint: "red",     cta: "Shop the sale" },
  { eyebrow: "Now on BazaarCo",    title: "Watch it. Love it.",   accent: "Buy it.",          sub: "Video-first shopping — see products in motion before you order. No more guessing from photos.", icon: "video", tint: "blue", cta: "Start watching" },
  { eyebrow: "Made in Nepal",      title: "Buy Nepali.",          accent: "Bargain freely.",  sub: "From Bhaktapur pottery to Pokhara honey — direct from makers, fair prices, no hidden fees.", icon: "palette", tint: "saffron", cta: "Discover local" },
];

function Hero({ slides }) {
  const { nav } = useBz();
  const heroSlides = slides?.length ? slides : HERO_SLIDES_FALLBACK;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const id = setInterval(() => setI(x => (x + 1) % heroSlides.length), 5000); return () => clearInterval(id); }, [paused, heroSlides.length]);
  const sl = heroSlides[i];
  const c = TINTS[sl.tint];
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      className="bz-split-hero"
      style={{ position: "relative", borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--blue-deep)", minHeight: 340, display: "flex" }}>
      <TempleWatermark />
      <div key={i} className="fade-up" style={{ position: "relative", zIndex: 2, flex: 1, padding: "52px 56px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 620 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 18 }}>
          <span style={{ fontSize: ".8125rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#fff", background: "var(--red)",
            padding: "5px 12px", borderRadius: "var(--r-sm)" }}>{sl.eyebrow}</span>
          <span style={{ fontSize: ".75rem", fontWeight: 700, color: "rgba(255,255,255,.7)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="badgeCheck" size={13} color="rgba(255,255,255,.7)" /> Low commission marketplace
          </span>
        </div>
        <h1 className="bz-hero-h1" style={{ margin: 0, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>
          {sl.title} <span style={{ color: "#ff6b75" }}>{sl.accent}</span></h1>
        <p style={{ color: "rgba(255,255,255,.78)", fontSize: "1.0625rem", marginTop: 18, maxWidth: 460, lineHeight: 1.55 }}>{sl.sub}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
          <Button variant="primary" size="lg" style={{ borderRadius: "var(--r-full)" }} iconRight="arrowRight"
            onClick={() => nav(i === 1 ? "video" : "browse")}>{sl.cta}</Button>
          <span style={{ color: "rgba(255,255,255,.65)", fontSize: ".8125rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="truck" size={14} color="rgba(255,255,255,.65)" /> Same-day in Kathmandu valley
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
          {heroSlides.map((_, j) => <button key={j} onClick={() => setI(j)} aria-label={`Slide ${j+1}`}
            style={{ width: j === i ? 28 : 9, height: 9, borderRadius: 999, border: "none", cursor: "pointer",
              background: j === i ? "var(--red)" : "rgba(255,255,255,.35)", transition: "all var(--dur-standard) var(--ease)" }} />)}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 2, width: 420, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 300, height: 300, borderRadius: "var(--r-xl)", background: `linear-gradient(150deg, ${c[1]}, ${c[0]})`,
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-3)", transform: "rotate(-3deg)" }}>
          <Icon name={sl.icon} size={130} color={c[2]} stroke={1.3} style={{ opacity: .7 }} />
        </div>
      </div>
    </div>
  );
}

function TempleWatermark({ opacity = 0.07 }) {
  return <svg viewBox="0 0 400 300" style={{ position: "absolute", right: 0, bottom: 0, height: "100%", width: "auto", zIndex: 1, opacity }} aria-hidden="true">
    <g fill="#fff">
      <path d="M200 20 L250 70 L150 70 Z" />
      <rect x="160" y="70" width="80" height="14" />
      <path d="M200 84 L240 124 L160 124 Z" />
      <rect x="168" y="124" width="64" height="12" />
      <path d="M200 136 L232 170 L168 170 Z" />
      <rect x="150" y="170" width="100" height="110" />
      <rect x="185" y="210" width="30" height="70" />
    </g>
  </svg>;
}

function TrustCard({ it }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "#fff", border: `1.5px solid ${hov ? "var(--blue)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)", padding: "24px 22px", display: "flex", gap: 14, alignItems: "flex-start",
        transition: "border-color var(--dur-standard) var(--ease), box-shadow var(--dur-standard) var(--ease)",
        boxShadow: hov ? "var(--sh-2)" : "var(--sh-1)" }}>
      <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: hov ? "var(--blue)" : "var(--tint-blue-50)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        transition: "all var(--dur-standard) var(--ease)", color: hov ? "#fff" : "var(--blue)" }}>
        <Icon name={it.icon} size={20} color="currentColor" /></div>
      <div><div style={{ fontWeight: 700, fontSize: ".9375rem", color: "var(--ink-900)" }}>{it.t}</div>
        <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 6, lineHeight: 1.45 }}>{it.s}</div></div>
    </div>
  );
}

function TrustStrip({ items }) {
  const trustItems = items?.length ? items : [
    { icon: "percent", t: "Low Commission", s: "Sellers keep more, you pay less." },
    { icon: "lock",    t: "Secure Payment",    s: "eSewa, Khalti, Fonepay, IME." },
    { icon: "truck",   t: "Fast Delivery",     s: "Same-day in Kathmandu valley." },
    { icon: "returns", t: "Easy Returns",      s: "7-day no-questions returns." },
  ];
  return <div className="bz-row-4up" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
    {trustItems.map((it, i) => <TrustCard key={i} it={it} />)}
  </div>;
}

function VideoRailCard({ p, onOpen, live }) {
  return <div onClick={() => onOpen(p)} style={{ cursor: "pointer", flexShrink: 0, width: 188, position: "relative" }}>
    <div style={{ position: "relative" }}>
      <VideoPlayer tint={p.tint} icon={p.icon} ratio="9 / 14" compact label="WATCH" thumb={p.videoThumb} src={p.videoUrl} />
      {live && (
        <span style={{ position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 999, background: "var(--red)", color: "#fff", fontWeight: 800, fontSize: ".7rem", letterSpacing: ".04em" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "bz-mic-pulse 1.2s ease-in-out infinite" }} />
          LIVE
        </span>
      )}
    </div>
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: ".875rem", fontWeight: 600, color: "var(--ink-900)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <Price value={p.price} size="sm" />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--gold)", fontSize: ".6875rem", fontWeight: 700 }}>
          <Icon name="badgeCheck" size={13} color="var(--gold)" />
        </span>
      </div>
    </div>
  </div>;
}

function FeaturedSellers({ sellers }) {
  const { nav } = useBz();
  const list = Object.values(sellers ?? {}).filter(s => s.verified).slice(0, 4);
  // Curated section: cap columns to actual count so a short list never leaves a trailing empty track.
  return <div className="bz-grid-cards" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(list.length, 4)},1fr)`, gap: 18 }}>
    {list.map(s => <div key={s.id} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px", overflow: "hidden", border: "2px solid var(--line-200)" }}>
        <img src={s.avatar} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: ".9375rem", display: "inline-flex", alignItems: "center", gap: 4 }}>{s.name} <Icon name="badgeCheck" size={15} color="var(--gold)" /></div>
      <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}><RatingStars value={s.rating} size={13} showVal count={s.reviews} /></div>
      <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="mapPin" size={12} color="var(--ink-400)" /> {s.city}</div>
      <div style={{ marginTop: 14 }}><Button variant="secondary" size="sm" full onClick={() => nav("browse")}>Visit Store</Button></div>
    </div>)}
  </div>;
}

function SkeletonRail({ cols = 5 }) {
  return (
    <div className="bz-grid-cards" style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 18 }}>
      {Array.from({ length: cols }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function Home() {
  const { nav, openProduct } = useBz();
  const { data: homeData, isLoading: homeLoading, isError: homeError, error: homeErr } = useHome();
  const catalog = useCatalog();
  const loading = homeLoading || catalog.isLoading;
  const isError = homeError || catalog.isError;
  const error = homeErr ?? catalog.error;
  const { products, categories, sellers, byId, videoProducts, flashProducts } = catalog;
  const trending = homeData?.trending?.length ? homeData.trending : [byId("bz-12"), byId("bz-1"), byId("bz-8"), byId("bz-3"), byId("bz-11")].filter(Boolean);
  const madeInNepal = [byId("bz-8"), byId("bz-11"), byId("bz-3"), byId("bz-12"), byId("bz-1")].filter(Boolean);
  const feedPaged = usePaged(products.filter(p => !p.outOfStock), 20);
  const W = ({ children, style }) => <section className="bz-container-pad" style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 28px", ...style }}>{children}</section>;
  return (
    <ApiState isLoading={loading} isError={isError} error={error}>
    <div style={{ paddingBottom: 8 }}>
      <BackToTop />
      {/* Desktop hero — hidden on phones */}
      <div className="bz-hide-mobile"><W style={{ paddingTop: 22 }}><Hero slides={homeData?.heroSlides} /></W></div>

      {/* Mobile-only compact greeting + offer banner */}
      <div className="bz-show-mobile">
        <W style={{ paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--tint-red-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 22 }}>🙏</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", fontWeight: 600 }}>Namaste</div>
              <div style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--blue-deep)" }}>Let's shop · किनमेल गरौं</div>
            </div>
          </div>
          <button onClick={() => nav("browse")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(90deg, var(--tint-red-50), #fff)", border: "1.5px solid var(--red)", borderRadius: "var(--r-lg)", padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="gift" size={22} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: "var(--red)", fontSize: ".9375rem" }}>Up to Rs. 75 OFF</div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>on your 1st order · पहिलो अर्डर</div>
            </div>
            <Icon name="arrowRight" size={18} color="var(--red)" />
          </button>

          {/* Trust pills — honest differentiators */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
            {[
              { icon: "returns", t: "7-day returns" },
              { icon: "bargain", t: "Bargain freely" },
              { icon: "video",   t: "Real videos" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, padding: "10px 6px", background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-md)" }}>
                <Icon name={p.icon} size={18} color="var(--blue)" />
                <div style={{ fontSize: ".6875rem", fontWeight: 700, color: "var(--ink-700)", lineHeight: 1.2 }}>{p.t}</div>
              </div>
            ))}
          </div>
        </W>
      </div>

      {/* categories */}
      <W style={{ paddingTop: 24 }}>
        <SectionHead eyebrow="Browse" title="Shop by category" action="All categories" onAction={() => nav("browse")} />
        <div className="bz-cat-row no-scrollbar" style={{ display: "flex", justifyContent: "space-between", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {(categories ?? []).map(c => <CategoryTile key={c.id} c={c} onClick={() => nav("browse")} />)}
        </div>
      </W>

      {/* flash sale */}
      <W style={{ paddingTop: 44 }}>
        <div className="bz-flash-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", rowGap: 10, background: "linear-gradient(90deg, var(--red), var(--saffron))",
          borderRadius: "var(--r-lg) var(--r-lg) 0 0", padding: "14px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", flexWrap: "wrap", rowGap: 6, minWidth: 0 }}>
            <Icon name="zap" size={22} fill="#fff" color="#fff" />
            <span style={{ fontWeight: 800, fontSize: "1.125rem", whiteSpace: "nowrap" }}>Flash Sale</span>
            <span style={{ fontSize: ".8125rem", opacity: .9, whiteSpace: "nowrap" }}>Ends in</span>
            <Countdown />
          </div>
          <button onClick={() => nav("browse")} style={{ background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", color: "#fff",
            fontWeight: 700, padding: "8px 14px", borderRadius: "var(--r-md)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap" }}>
            View all <Icon name="arrowRight" size={16} /></button>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderTop: "none", borderRadius: "0 0 var(--r-lg) var(--r-lg)", padding: 18 }}>
          {loading
            ? <SkeletonRail cols={5} />
            : <ProductRail items={flashProducts().slice(0, 5)} onOpen={openProduct} cols={5} />}
        </div>
      </W>

      {/* Bargain hero strip — BazaarCo's core differentiator vs Daraz/SastoDeal. Show on every screen size. */}
      <W style={{ paddingTop: 36 }}>
        <button onClick={() => nav("bargains")} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 16, textAlign: "left",
          background: "linear-gradient(120deg, var(--blue-deep) 0%, #1e3a8a 100%)",
          border: "none", borderRadius: "var(--r-xl)", padding: "22px 24px", cursor: "pointer",
          color: "#fff", boxShadow: "var(--sh-2)",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="bargain" size={28} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#ff6b75", marginBottom: 4 }}>BazaarCo difference</div>
            <div style={{ fontSize: "1.0625rem", fontWeight: 800, lineHeight: 1.25 }}>
              Found something? <span style={{ color: "#ff6b75" }}>Bargain.</span>
            </div>
            <div style={{ fontSize: ".8125rem", color: "rgba(255,255,255,.78)", marginTop: 2 }}>
              Make an offer on any product · मोलतोल गर्नुहोस्
            </div>
          </div>
          <Icon name="arrowRight" size={22} color="#fff" />
        </button>
      </W>

      {/* trending in Kathmandu — hyperlocal */}
      <W style={{ paddingTop: 52 }}>
        <SectionHead
          eyebrow={<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="mapPin" size={13} color="var(--red)" /> Trending in Kathmandu</span>}
          title="What your city is buying right now"
          action="See more"
          onAction={() => nav("browse")} />
        {loading ? <SkeletonRail cols={5} /> : <ProductRail items={trending} onOpen={openProduct} cols={5} />}
      </W>

      {/* video shopping rail — desktop only */}
      <div className="bz-hide-mobile">
        <W style={{ paddingTop: 52 }}>
          <div style={{ background: "var(--blue-deep)", borderRadius: "var(--r-xl)", padding: "30px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#ff6b75", marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="video" size={15} color="#ff6b75" /> Watch
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "rgba(220,38,38,.2)", color: "#fff", fontSize: ".65rem", letterSpacing: ".04em" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", animation: "bz-mic-pulse 1.2s ease-in-out infinite" }} /> 3 LIVE NOW
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>See it in motion before you <span style={{ color: "#ff6b75" }}>buy</span></h2>
              </div>
              <Button variant="primary" onClick={() => nav("video")} iconRight="arrowRight">Open video feed</Button>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 4 }}>
              {videoProducts().map((p, i) => <VideoRailCard key={p.id} p={p} onOpen={openProduct} live={i < 3} />)}
            </div>
          </div>
        </W>
      </div>

      {/* made in nepal */}
      <W style={{ paddingTop: 52, position: "relative" }}>
        <SectionHead eyebrow="Made in Nepal" title="Loved in Nepal" action="See more" onAction={() => nav("browse")} />
        {loading ? <SkeletonRail cols={5} /> : <ProductRail items={madeInNepal} onOpen={openProduct} cols={5} />}
      </W>

      {/* featured sellers — desktop only; Meesho-style buyer doesn't need seller browsing here */}
      <div className="bz-hide-mobile">
        <W style={{ paddingTop: 52 }}>
          <SectionHead eyebrow="Trusted stores" title="Featured" accent="sellers" action="All sellers" onAction={() => nav("browse")} />
          <FeaturedSellers sellers={sellers} />
        </W>
      </div>

      {/* trust strip — desktop only; mobile already has trust pills above */}
      <div className="bz-hide-mobile">
        <W style={{ paddingTop: 56 }}>
          <TrustStrip items={homeData?.trustItems} />
        </W>
      </div>

      {/* Mobile-only: endless product feed */}
      <div className="bz-show-mobile">
        <W style={{ paddingTop: 28 }}>
          <SectionHead eyebrow="Just for you" title="More to explore" />
          <div className="bz-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {feedPaged.visible.map(p => <ProductCard key={p.id} p={p} onClick={openProduct} />)}
          </div>
          <LoadMore paged={feedPaged} noun="products" style={{ paddingBottom: 12 }} />
        </W>
      </div>
    </div>
    </ApiState>
  );
}
