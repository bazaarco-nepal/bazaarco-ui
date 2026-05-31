'use client';


import React from "react";
import { Icon, Logo, Button, Spinner, IconButton, RatingStars, Chip, VerifiedBadge, StatusPill, Price, Placeholder, VideoPlayer, SkeletonCard, EmptyState, QtyStepper, Toast, SectionHead, TINTS, HelpLifeline, AllInPriceCard, OTPInput, MenuRow, ChipGroup, MobileBuyBar, BottomNav, LandmarkAddress, VoiceMicButton, usePaged, usePages, LoadMore, PageBar, BackToTop, ApiState } from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useTracking } from "@/hooks/use-tracking";
import { useBargains } from "@/hooks/use-bargains";
import { BazaarCtx, useBz, Himalaya, KathmanduSkyline, ProductCard, ProductRail, CategoryTile, Navbar, Footer, DevViewSwitcher } from "@/components/common";


export function Tracking() {
  const { nav, cart } = useBz();
  const { data, isLoading, isError, error } = useTracking("BZ-24501");
  const nodes = data?.nodes ?? [];
  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 28px 0" }}>
      <button onClick={() => nav("home")} style={{ background: "none", border: "none", color: "var(--ink-500)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: ".875rem" }}><Icon name="chevronLeft" size={16} /> Back to home</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Order <span className="tnum">#{data?.orderId ?? "BZ-24501"}</span></h1>
          <span style={{ fontSize: ".875rem", color: "var(--ink-400)" }}>Placed May 29, 2026</span></div>
        <StatusPill status="packed" />
      </div>

      <div className="bz-stack-900" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 28 }}>
          {nodes.map((n, i) => <div key={i} style={{ display: "flex", gap: 16, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: n.state==="done"?"var(--blue)":n.state==="current"?"var(--saffron)":"#fff",
                border: n.state==="future"?"2px solid var(--line-200)":"none", animation: n.state==="current"?"bz-pulse 1.8s infinite":"none" }}>
                {n.state==="done" && <Icon name="check" size={15} color="#fff" />}
                {n.state==="current" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}</span>
              {i < nodes.length-1 && <span style={{ width: 2, flex: 1, minHeight: 40, background: n.state==="done"?"var(--blue)":"var(--line-200)" }} />}
            </div>
            <div style={{ paddingBottom: i<nodes.length-1?24:0 }}>
              <div style={{ fontWeight: 700, fontSize: ".9375rem", color: n.state==="future"?"var(--ink-400)":"var(--ink-900)" }}>{n.t}</div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-400)", margin: "2px 0 4px" }}>{n.loc} · {n.time}</div>
              <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>{n.detail}</div>
            </div>
          </div>)}
        </div>

        <TrackingSidebar nav={nav} cart={cart} />
      </div>
    </div>
    </ApiState>
  );
}

function TrackingSidebar({ nav, cart }) {
  const { byId } = useCatalog();
  const fallbackItems = [byId("bz-1"), byId("bz-3")].filter(Boolean);
  const displayItems = cart.length ? cart : fallbackItems;
  return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 96 }}>
          <button style={{ background: "var(--success)", color: "#fff", border: "none", borderRadius: "var(--r-lg)", padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--sh-2)", animation: "bz-pulse-ring 2s infinite" }}>
            <span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="phone" size={22} color="#fff" />
            </span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>Call rider · राइडरलाई फोन</div>
              <div style={{ fontSize: ".8125rem", opacity: .9 }}>Ramesh K. · arrives in about 25 min</div>
            </div>
            <Icon name="arrowRight" size={20} color="#fff" />
          </button>

          <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
            <div style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Estimated delivery</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--blue-deep)", marginTop: 4 }}>Sat, May 30</div>
            <div style={{ borderTop: "1px solid var(--line-200)", marginTop: 14, paddingTop: 14 }}>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>Courier</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: ".875rem" }}>Pathao Parcel</span>
                <button style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--blue)", fontWeight: 700, fontSize: ".8125rem", cursor: "pointer" }}><Icon name="copy" size={14} /> NP-77213</button>
              </div>
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: ".9375rem", marginBottom: 12 }}>Items</div>
            {displayItems.slice(0,3).map(it => <div key={it.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              {it.img ? (
                <img src={it.img} alt={it.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "var(--r-sm)" }} />
              ) : (
                <Placeholder icon={it.icon} tint={it.tint} style={{ width: 40, height: 40 }} radius="var(--r-sm)" />
              )}
              <span style={{ flex: 1, fontSize: ".8125rem", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.name}</span></div>)}
          </div>
          <Button variant="ghost" full icon="headphones">Need help?</Button>
          <Button variant="danger" full>Return / Refund</Button>
        </div>
  );
}

export function Wishlist() {
  const { wish, nav, openProduct } = useBz();
  const catalog = useCatalog();
  const { byId, isLoading, isError, error } = catalog;
  const items = wish.map(byId).filter(Boolean);
  const paged = usePaged(items, 12, items.length);
  if (catalog.isLoading) {
    return <ApiState isLoading={isLoading} isError={isError} error={error}><div /></ApiState>;
  }
  if (items.length === 0) return <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 28px" }}>
    <EmptyState title="Your wishlist is empty" message="Tap the heart on any product to save it here for later." cta="Start exploring" onCta={() => nav("home")} secondary="Watch" onSecondary={() => nav("video")} />
  </div>;
  return <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 0" }}>
    <h1 style={{ margin: "0 0 20px", fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Wishlist <span className="tnum" style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: "1rem" }}>· {items.length}</span></h1>
    <div className="bz-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>{paged.visible.map(p => <ProductCard key={p.id} p={p} onClick={openProduct} />)}</div>
    <LoadMore paged={paged} noun="saved items" nounNe="सेभ गरिएका सामान" />
  </div>;
}

export function Bargains() {
  const { nav, openProduct, toast } = useBz();
  const { data: offers = [], isLoading, isError, error } = useBargains();

  const tones = { pending: "saffron", countered: "blue", accepted: "success", declined: "neutral" };
  const labels = { pending: "Waiting for seller", countered: "Seller countered", accepted: "Accepted · add to cart", declined: "Declined" };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
    <div className="bz-container-pad" style={{ maxWidth: 820, margin: "0 auto", padding: "20px 28px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="bargain" size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Bargain · <span className="ne" style={{ color: "var(--ink-500)", fontWeight: 600, fontSize: "1rem" }}>मोलतोल</span>
          </h1>
          <p style={{ margin: "2px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>Your offers and seller responses.</p>
        </div>
      </div>

      <div style={{ background: "var(--tint-blue-50)", border: "1px solid var(--blue)", borderRadius: "var(--r-md)", padding: "12px 14px", margin: "16px 0 20px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon name="bargain" size={18} color="var(--blue)" />
        <div style={{ fontSize: ".875rem", color: "var(--ink-700)", lineHeight: 1.45 }}>
          <b>How it works:</b> open any product, tap <b>Make an offer</b>. Sellers usually reply within minutes. Accepted offers add to cart at the bargained price.
        </div>
      </div>

      {offers.length === 0 ? (
        <EmptyState title="No offers yet" message="Bargain on any product to see your offers here." cta="Browse products" onCta={() => nav("browse")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {offers.map(o => (
            <div key={o.id} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div onClick={() => openProduct(o.p)} style={{ cursor: "pointer", flexShrink: 0 }}>
                  {o.p.img
                    ? <img src={o.p.img} alt={o.p.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--r-md)" }} />
                    : <Placeholder icon={o.p.icon} tint={o.p.tint} style={{ width: 72, height: 72 }} radius="var(--r-md)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: ".9375rem", color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{o.p.name}</div>
                    <Chip tone={tones[o.status]} size="sm">{labels[o.status]}</Chip>
                  </div>
                  <div className="tnum" style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: ".8125rem", marginTop: 8 }}>
                    <span><span style={{ color: "var(--ink-400)" }}>Listed:</span> <span style={{ textDecoration: "line-through", color: "var(--ink-500)" }}>Rs. {o.listed.toLocaleString()}</span></span>
                    <span><span style={{ color: "var(--ink-400)" }}>Your offer:</span> <b style={{ color: "var(--blue-deep)" }}>Rs. {o.yourOffer.toLocaleString()}</b></span>
                    {o.sellerCounter && <span><span style={{ color: "var(--ink-400)" }}>Counter:</span> <b style={{ color: "var(--red)" }}>Rs. {o.sellerCounter.toLocaleString()}</b></span>}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
                    {o.age}{o.expires ? ` · expires in ${o.expires}` : ""}
                  </div>
                </div>
              </div>

              {(o.status === "pending" || o.status === "countered" || o.status === "accepted") && (
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {o.status === "accepted" && <Button variant="primary" size="sm" icon="cart" onClick={() => toast("Added at bargained price · Rs. " + o.yourOffer.toLocaleString())}>Add to cart</Button>}
                  {o.status === "countered" && <>
                    <Button variant="primary" size="sm" onClick={() => toast("Counter accepted")}>Accept Rs. {o.sellerCounter.toLocaleString()}</Button>
                    <Button variant="secondary" size="sm" onClick={() => openProduct(o.p)}>Counter back</Button>
                  </>}
                  {o.status === "pending" && <Button variant="ghost" size="sm" onClick={() => toast("Offer withdrawn")}>Withdraw offer</Button>}
                  {o.status !== "accepted" && <Button variant="ghost" size="sm" onClick={() => openProduct(o.p)}>View product</Button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Button variant="secondary" full icon="bargain" onClick={() => nav("browse")}>Find products to bargain on</Button>
      </div>
    </div>
    </ApiState>
  );
}
