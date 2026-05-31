'use client';


import React, { useState, useEffect, Fragment } from "react";
import { Icon, Logo, Button, Spinner, IconButton, RatingStars, Chip, VerifiedBadge, StatusPill, Price, Placeholder, VideoPlayer, SkeletonCard, EmptyState, QtyStepper, Toast, SectionHead, TINTS, HelpLifeline, AllInPriceCard, OTPInput, MenuRow, ChipGroup, MobileBuyBar, BottomNav, LandmarkAddress, VoiceMicButton, usePaged, usePages, LoadMore, PageBar, BackToTop } from "@/components/ui";
import { CATEGORIES, ATTR_CATEGORIES, CATEGORY_ATTRIBUTES, PRODUCTS, SELLERS, REVIEWS, byId, sellerOf, inCat, videoProducts, flashProducts, productProfile, P } from "@/constants/catalog";
import { BazaarCtx, useBz, Himalaya, KathmanduSkyline, ProductCard, ProductRail, CategoryTile, Navbar, Footer, DevViewSwitcher } from "@/components/common";
import { ASSETS } from "@/config/assets";

export const sellerOrderRef = { current: null as (typeof INBOX_ORDERS)[number] | null };
export const sellerCoachedRef = { current: false };


export const SELLER_NAV = [
  { group: "Daily work", items: [
    { id: "s-dashboard", icon: "home",        en: "Home",         ne: "गृह" },
    { id: "s-inbox",     icon: "package",     en: "Orders",       ne: "अर्डर",       badgeKey: "orders" },
    { id: "s-chat",      icon: "message",     en: "Messages",     ne: "च्याट",       badgeKey: "chat" },
    { id: "s-add",       icon: "plus",        en: "Add product",  ne: "सामान थप्नुहोस्" },
  ]},
  { group: "My shop", items: [
    { id: "s-products",  icon: "store",       en: "My products",  ne: "मेरो सामान" },
    { id: "s-videos",    icon: "video",       en: "Videos",       ne: "भिडियो" },
    { id: "s-storefront",icon: "layout",      en: "Shop design",  ne: "पसल सजावट" },
  ]},
  { group: "Sell more", items: [
    { id: "s-promos",    icon: "megaphone",   en: "Offers",       ne: "छुट" },
    { id: "s-bargain",   icon: "bargain",     en: "Bargaining",   ne: "मोलतोल",     badgeKey: "bargain" },
    { id: "s-reviews",   icon: "star",        en: "Reviews",      ne: "समीक्षा" },
  ]},
  { group: "Money & growth", items: [
    { id: "s-ledger",    icon: "wallet",      en: "My money",     ne: "भुक्तानी" },
    { id: "s-analytics", icon: "trendingUp",  en: "My shop",      ne: "मेरो पसल" },
    { id: "s-reports",   icon: "file",        en: "What to do",   ne: "के गर्ने" },
  ]},
  { group: "Account", items: [
    { id: "s-settings",  icon: "settings",    en: "Settings",     ne: "सेटिङ" },
    { id: "s-profile",   icon: "user",        en: "My profile",   ne: "प्रोफाइल" },
  ]},
];

export const SELLER_BADGES = { orders: 2, chat: 3, bargain: 1 };

export function SellerSidebar({ screen, onNav, collapsed, setCollapsed, openMobile, setOpenMobile }) {
  const close = () => setOpenMobile(false);
  return (
    <>
      <div className={"bz-side-overlay" + (openMobile ? " show" : "")} onClick={close} />
      <aside className={"bz-seller-side" + (collapsed ? " collapsed" : "") + (openMobile ? " open" : "")}>
        <div className="bz-side-head">
          <div className="bz-side-brand">
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800 }}>
              <Icon name="store" size={20} color="#fff" />
            </div>
            <div className="bz-side-brand-text" style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, color: "var(--blue-deep)", fontSize: ".9375rem" }}>BazaarCo</div>
              <div style={{ fontSize: ".68rem", color: "var(--ink-500)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Seller</div>
            </div>
          </div>
          <button
            className="bz-side-toggle"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={16} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "6px 0", overflowY: "auto" }}>
          {SELLER_NAV.map(grp => (
            <div key={grp.group}>
              <div className="bz-side-group">{grp.group}</div>
              {grp.items.map(it => {
                const active = screen === it.id;
                const badge = it.badgeKey && SELLER_BADGES[it.badgeKey];
                return (
                  <button key={it.id} className={"bz-side-item" + (active ? " active" : "")}
                    onClick={() => { onNav(it.id); close(); }}
                    title={it.en}>
                    <Icon name={it.icon} size={20} color={active ? "var(--red)" : "var(--ink-700)"} />
                    <span className="bz-side-label">
                      <span className="bz-side-en">{it.en}</span>
                      <span className="bz-side-sub ne">{it.ne}</span>
                    </span>
                    {badge ? <span className="bz-side-badge">{badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

export function SellerShell({ screen, children }) {
  const { nav } = useBz();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("bz-seller-collapsed") === "1"; } catch { return false; }
  });
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("bz-seller-collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  useEffect(() => {
    const h = () => setOpenMobile(true);
    window.addEventListener("bz-seller-menu", h);
    return () => window.removeEventListener("bz-seller-menu", h);
  }, []);

  const current = SELLER_NAV.flatMap(g => g.items).find(it => it.id === screen);

  return (
    <div className={"bz-seller-shell" + (collapsed ? " collapsed" : "")}>
      <SellerSidebar screen={screen} onNav={nav} collapsed={collapsed} setCollapsed={setCollapsed} openMobile={openMobile} setOpenMobile={setOpenMobile} />
      <section className="bz-side-content">
        <div className="bz-side-mobile-bar">
          <button onClick={() => setOpenMobile(true)} aria-label="Menu"
            style={{ width: 40, height: 40, borderRadius: "var(--r-md)", border: "1px solid var(--line-200)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="menu" size={22} />
          </button>
          <h2>{current ? current.en : "BazaarCo Seller"}</h2>
        </div>
        {children}
      </section>
    </div>
  );
}

/* ---------- Shared seller chrome ---------- */

export function SellerHelpBar({ tutorial, onTutorial }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const [big, setBig] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = big ? "18px" : "";
    return () => { document.documentElement.style.fontSize = ""; };
  }, [big]);

  const row = {
    display: "flex", alignItems: "center", gap: 14, width: "100%",
    background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)",
    padding: "16px 18px", cursor: "pointer", textAlign: "left", fontWeight: 700, fontSize: "1rem",
    color: "var(--ink-900)",
  };

  return (
    <>
      {/* Floating help FAB — bottom-right, thumb-zone, persistent on every seller screen.
          Lifts above mobile bottom-nav (56px) via bottom: 84px on small screens. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Help · सहयोग"
        title="Help · सहयोग"
        className="bz-help-fab"
        style={{ background: "#16a34a", width: 64, height: 64, bottom: 90, right: 22 }}
      >
        <Icon name="phone" size={28} color="#fff" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(11,18,32,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="fade-up"
            style={{ background: "#fff", borderRadius: "var(--r-xl) var(--r-xl) 0 0", width: "100%", maxWidth: 480, padding: "22px 22px 28px" }}
          >
            <div style={{ width: 40, height: 4, background: "var(--line-200)", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ margin: "0 0 4px", fontSize: "1.25rem", fontWeight: 800, color: "var(--ink-900)" }}>
              Need help? <span className="ne" style={{ color: "var(--ink-500)", fontWeight: 600 }}>· सहयोग चाहियो?</span>
            </h3>
            <p style={{ margin: "0 0 18px", color: "var(--ink-500)", fontSize: ".875rem" }}>
              Nepali-speaking agent. Free call.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="tel:16600121234" style={{ ...row, background: "#16a34a", borderColor: "#16a34a", color: "#fff", textDecoration: "none" }}>
                <Icon name="phone" size={22} color="#fff" />
                <span style={{ flex: 1 }}>Call us · फोन गर्नुहोस्</span>
                <span style={{ fontWeight: 800, fontSize: ".875rem" }}>16600-12-12-34</span>
              </a>

              <button style={row} onClick={() => { alert("Opens WhatsApp chat with BazaarCo support"); setOpen(false); }}>
                <Icon name="headphones" size={22} color="#25D366" />
                <span style={{ flex: 1 }}>WhatsApp chat · च्याट</span>
                <Icon name="chevronRight" size={20} color="var(--ink-400)" />
              </button>

              {tutorial && (
                <button style={row} onClick={() => { setOpen(false); onTutorial?.(); }}>
                  <Icon name="play" size={22} color="var(--blue)" />
                  <span style={{ flex: 1 }}>Replay guide · सिक्नुहोस्</span>
                  <Icon name="chevronRight" size={20} color="var(--ink-400)" />
                </button>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                <button style={{ ...row, justifyContent: "center", padding: "14px 12px" }} onClick={() => setLang(l => l === "EN" ? "NE" : "EN")}>
                  <Icon name="badgeCheck" size={20} color="var(--ink-700)" />
                  <span>{lang === "EN" ? "English" : "नेपाली"}</span>
                </button>
                <button style={{ ...row, justifyContent: "center", padding: "14px 12px" }} onClick={() => setBig(b => !b)}>
                  <span style={{ fontWeight: 800, fontSize: "1.125rem" }}>Aa{big ? "−" : "+"}</span>
                  <span>{big ? "Normal" : "Bigger"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SellerCoachmark({ steps, onDone }) {
  const [i, setI] = useState(0);
  if (i >= steps.length) return null;
  const s = steps[i];
  const last = i === steps.length - 1;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.72)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
         onClick={() => { if (last) onDone(); else setI(i + 1); }}>
      <div style={{ background: "#fff", borderRadius: "var(--r-lg)", maxWidth: 360, padding: 24, textAlign: "center" }}
           onClick={e => e.stopPropagation()}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--tint-blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Icon name={s.icon} size={32} color="var(--blue)" />
        </div>
        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}>{s.title}</h3>
        <p className="ne" style={{ color: "var(--ink-500)", margin: "4px 0 0", fontSize: ".9rem" }}>{s.ne}</p>
        <p style={{ color: "var(--ink-700)", marginTop: 12, lineHeight: 1.5 }}>{s.body}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "16px 0" }}>
          {steps.map((_, j) => (
            <span key={j} style={{ width: j === i ? 22 : 7, height: 7, borderRadius: 999, background: j === i ? "var(--blue)" : "var(--line-200)" }} />
          ))}
        </div>
        <Button variant="primary" full size="lg" onClick={() => { if (last) onDone(); else setI(i + 1); }}>
          {last ? "Got it · बुझेँ" : "Next · अर्को"}
        </Button>
        {!last && (
          <button onClick={onDone} style={{ background: "none", border: "none", color: "var(--ink-400)", marginTop: 10, cursor: "pointer", fontSize: ".8125rem", fontWeight: 600 }}>
            Skip guide
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- 4.1 Seller Onboarding ---------- */
export function SellerOnboarding() {
  const { nav } = useBz();
  const [stage, setStage] = useState("hero"); // hero | docPick | scanning | review | bank | done
  const [docType, setDocType] = useState(null); // pan | nid
  const [scanned, setScanned] = useState(null);
  const [wallet, setWallet] = useState(null);

  const snap = (type) => {
    setDocType(type);
    setStage("scanning");
    setTimeout(() => {
      setScanned(type === "pan"
        ? { name: "Pemba Sherpa", shop: "Bhaktapur Handicraft Bhandar", docLabel: "PAN", docId: "601234567", address: "Suryabinayak-4, Bhaktapur" }
        : { name: "Pemba Sherpa", shop: "Pemba's Shop",                 docLabel: "NID",  docId: "123-456-789-0",  address: "Suryabinayak-4, Bhaktapur" });
      setStage("review");
    }, 1800);
  };

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <SellerHelpBar />

      {stage === "hero" && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <img src={ASSETS.mascot} alt="" style={{ width: 180, height: 180, objectFit: "contain", marginBottom: 10 }} />
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Open your shop on <span style={{ color: "var(--red)" }}>BazaarCo</span>
          </h1>
          <p className="ne" style={{ color: "var(--ink-500)", marginTop: 6 }}>आफ्नो पसल बजारकोमा खोल्नुहोस्</p>

          <div style={{ background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", padding: 14, marginTop: 20, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <Icon name="play" size={26} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "var(--blue-deep)" }}>Watch 60-sec guide</div>
              <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>३ मिनेटमा पसल खोल्न सिक्नुहोस्</div>
            </div>
            <Icon name="chevronRight" size={20} color="var(--blue)" />
          </div>

          <div style={{ marginTop: 22, textAlign: "left", padding: "0 4px" }}>
            {[
              ["Low commission marketplace",      "कम कमिसन बजार",              "percent"],
              ["Add a product in 3 taps",         "३ ट्यापमा सामान थप्नुहोस्",     "plus"],
              ["Daily payouts to eSewa / Khalti", "दैनिक भुक्तानी eSewa / Khalti", "wallet"],
            ].map(([t, ne, i], idx, arr) => (
              <div key={t} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: idx < arr.length - 1 ? "1px dashed var(--line-200)" : "none" }}>
                <Icon name={i} size={22} color="var(--blue)" />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{t}</div>
                  <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{ne}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <Button variant="primary" size="lg" full icon="image" onClick={() => setStage("docPick")}>
              Register your shop · पसल दर्ता गर्नुहोस्
            </Button>
            <Button variant="ghost" full onClick={() => nav("home")} style={{ marginTop: 10 }}>I'll do this later · पछि गर्छु</Button>
          </div>
        </div>
      )}

      {stage === "docPick" && (
        <div>
          <button onClick={() => setStage("hero")} style={{ background: "none", border: "none", color: "var(--ink-500)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Icon name="chevronLeft" size={16} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, color: "var(--blue-deep)" }}>Which document do you have?</h2>
          <p className="ne" style={{ color: "var(--ink-500)", margin: "4px 0 18px" }}>कुन कागजात छ?</p>

          {[
            { id: "pan", icon: "package", title: "PAN Card",  ne: "प्यान कार्ड",               sub: "Registered business · sell any volume" },
            { id: "nid", icon: "user",    title: "NID Card",  ne: "राष्ट्रिय परिचयपत्र",      sub: "Individual seller · PAN required once sales cross IRD limit" },
          ].map(d => (
            <button key={d.id} onClick={() => snap(d.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 12, cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: "var(--tint-blue-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={d.icon} size={28} color="var(--blue)" />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>{d.title}</div>
                <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>{d.ne}</div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{d.sub}</div>
              </div>
              <Icon name="chevronRight" size={22} color="var(--ink-400)" />
            </button>
          ))}

          <div style={{ background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", padding: 12, fontSize: ".8125rem", color: "var(--blue-deep)", display: "flex", gap: 8, marginTop: 6 }}>
            <Icon name="badgeCheck" size={16} color="var(--blue)" />
            <span>No document? Call <a href="tel:16600121234" style={{ color: "var(--blue)", fontWeight: 700 }}>16600-12-12-34</a> — we visit you.</span>
          </div>
        </div>
      )}

      {stage === "scanning" && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ width: 280, height: 180, margin: "0 auto", background: "var(--ink-900)", borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden" }}>
            <div className="skel" style={{ position: "absolute", inset: 12, borderRadius: "var(--r-md)" }} />
            <div style={{ position: "absolute", inset: 0, border: "2px solid var(--red)", borderRadius: "var(--r-lg)", animation: "bz-mic-pulse 1.6s ease-in-out infinite" }} />
          </div>
          <h2 style={{ margin: "24px 0 6px", fontSize: "1.125rem" }}>Scanning your {docType === "pan" ? "PAN card" : "NID card"}…</h2>
          <p className="ne" style={{ color: "var(--ink-500)" }}>कागजात पढ्दैछौँ — एक छिन पर्खनुहोस्</p>
        </div>
      )}

      {stage === "review" && scanned && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--success)", fontWeight: 700, marginBottom: 12 }}>
            <Icon name="check" size={20} color="var(--success)" /> Document recognised · पढियो
          </div>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem", fontWeight: 800 }}>Confirm your details</h2>
          {[
            ["Shop name · पसलको नाम", scanned.shop],
            ["Owner · मालिक",          scanned.name],
            [`${scanned.docLabel} no.`, scanned.docId],
            ["Address · ठेगाना",       scanned.address],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="check" size={18} color="var(--success)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 700 }}>{k}</div>
                <div style={{ fontWeight: 600 }}>{v}</div>
              </div>
              <button style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", fontSize: ".8125rem" }}>Edit</button>
            </div>
          ))}
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" full size="lg" onClick={() => setStage("bank")}>Looks right — continue · ठीक छ</Button>
          </div>
        </div>
      )}

      {stage === "bank" && (
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.25rem", fontWeight: 800 }}>How would you like to be paid?</h2>
          <p className="ne" style={{ color: "var(--ink-500)", marginTop: 0, marginBottom: 18 }}>पैसा कुन वालेटमा चाहिन्छ?</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { id: "esewa",   name: "eSewa",   tint: "green" },
              { id: "khalti",  name: "Khalti",  tint: "purple" },
              { id: "fonepay", name: "Fonepay", tint: "blue" },
              { id: "ime",     name: "IME Pay", tint: "red" },
            ].map(w => {
              const active = wallet === w.id;
              return (
                <button key={w.id} onClick={() => setWallet(w.id)}
                  style={{ background: active ? "var(--tint-blue-50)" : "#fff", border: `2px solid ${active ? "var(--blue)" : "var(--line-200)"}`,
                    borderRadius: "var(--r-lg)", padding: 18, cursor: "pointer", textAlign: "center" }}>
                  <span style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: TINTS[w.tint][0], color: TINTS[w.tint][2], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontWeight: 800, fontSize: "1.5rem" }}>{w.name[0]}</span>
                  <div style={{ fontWeight: 700 }}>{w.name}</div>
                  {active && <div style={{ marginTop: 4, color: "var(--blue)", fontSize: ".75rem", fontWeight: 700 }}>✓ Selected</div>}
                </button>
              );
            })}
          </div>

          {wallet && (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 6 }}>Your {wallet} number · वालेट नम्बर</label>
              <input inputMode="numeric" placeholder="98XXXXXXXX" className="tnum"
                style={{ width: "100%", height: 56, border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "0 16px", fontSize: "1.125rem", fontWeight: 700, outline: "none", fontFamily: "var(--font-sans)" }} />
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <Button variant="primary" full size="lg" disabled={!wallet} onClick={() => setStage("done")}>Save and go live · पसल खोल्नुहोस्</Button>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(22,163,74,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <Icon name="check" size={42} color="var(--success)" />
          </div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>You're live!</h1>
          <p className="ne" style={{ color: "var(--ink-500)", marginTop: 6 }}>पसल खुल्यो — पहिलो सामान थप्नुहोस्</p>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="primary" size="lg" full icon="plus" onClick={() => nav("s-add")}>Add your first product</Button>
            <Button variant="ghost" full onClick={() => nav("s-dashboard")}>Open dashboard · ड्यासबोर्ड हेर्नुहोस्</Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/* ---------- 4.2 Seller Dashboard ---------- */

export const COACH_DASHBOARD = [
  { icon: "wallet",  title: "Your earnings, big & clear", ne: "तपाईंको कमाइ — ठूलो अक्षरमा", body: "The big number on top is what you earned today after our small fee." },
  { icon: "package", title: "Orders inbox",               ne: "अर्डर इनबक्स",                body: "When someone buys, you see it here. Tap an order, tap Accept — that's it." },
  { icon: "plus",    title: "Add a product in 3 taps",    ne: "३ ट्यापमा सामान थप्नुहोस्",   body: "Take 3 photos, type a short description, set price. We handle the rest." },
  { icon: "phone",   title: "Stuck? Call us free",        ne: "अल्झियो? फोन गर्नुहोस्",      body: "The Call button at the top of every screen is free. We answer in Nepali." },
];

/* Inline SVG charts (no deps) */

export function SellerBarChart({ data, height = 180 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 100, H = 100;
  const n = data.length;
  const barW = (W - 8) / n - 2;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="var(--line-200)" strokeWidth=".3" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * 88;
          const x = 4 + i * ((W - 8) / n) + 1;
          const y = 96 - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill={d.highlight ? "var(--red)" : "var(--blue)"} rx="1" />
              <text x={x + barW / 2} y={y - 1.5} textAnchor="middle" fontSize="3.4" fontWeight="700" fill="var(--ink-700)">
                {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, marginTop: 6, fontSize: ".7rem", color: "var(--ink-500)", textAlign: "center", fontWeight: 600 }}>
        {data.map((d, i) => <div key={i}>{d.label}</div>)}
      </div>
    </div>
  );
}

export function SellerSparkline({ data, color = "var(--blue)", height = 36 }) {
  const max = Math.max(...data, 1), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / range) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity=".12" />
    </svg>
  );
}

export function SellerDonut({ slices, size = 160 }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40, c = 50, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-100)" strokeWidth="14" />
        {slices.map((s, i) => {
          const len = (s.value / total) * circ;
          const off = circ - acc;
          acc += len;
          return <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={off} />;
        })}
      </svg>
      <div style={{ flex: 1 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < slices.length - 1 ? "1px dashed var(--line-200)" : "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: ".875rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span style={{ fontWeight: 600 }}>{s.label}</span>
            </span>
            <span className="tnum" style={{ fontWeight: 800, fontSize: ".875rem" }}>{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SellerFunnel({ rows }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        const drop = i > 0 ? Math.round(((rows[i - 1].value - r.value) / rows[i - 1].value) * 100) : null;
        return (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: ".875rem", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name={r.icon} size={16} color={r.color} /> {r.label}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="tnum" style={{ fontWeight: 800 }}>{r.value.toLocaleString()}</span>
                {drop !== null && <span style={{ fontSize: ".7rem", color: "var(--danger)", fontWeight: 700 }}>−{drop}%</span>}
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "var(--line-100)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: r.color, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SellerDashboard() {
  const { nav, toast } = useBz();
  const [coach, setCoach] = useState(false);
  const [range, setRange] = useState("week"); // today | week | month

  useEffect(() => {
    if (!sellerCoachedRef.current) {
      setCoach(true);
      sellerCoachedRef.current = true;
    }
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const salesByDay = [
    { label: "Sat", value: 12500 },
    { label: "Sun", value: 18200 },
    { label: "Mon", value: 9600 },
    { label: "Tue", value: 21800 },
    { label: "Wed", value: 14200 },
    { label: "Thu", value: 18900 },
    { label: "Fri", value: 24500, highlight: true },
  ];

  const paymentSplit = [
    { label: "Cash on Delivery", value: 58, color: "var(--saffron)" },
    { label: "eSewa",            value: 24, color: "#16a34a" },
    { label: "Khalti",           value: 12, color: "#7360F2" },
    { label: "Fonepay / IME",    value:  6, color: "var(--blue)" },
  ];

  const funnel = [
    { label: "Product views",  value: 4820, icon: "image",   color: "var(--blue)" },
    { label: "Added to cart",  value:  612, icon: "cart",    color: "var(--saffron)" },
    { label: "Checkout start", value:  214, icon: "package", color: "var(--red)" },
    { label: "Orders placed",  value:  118, icon: "check",   color: "var(--success)" },
  ];

  const topProducts = [
    { name: "Green Cotton Kurta Suit",  units: 24, rev: 28800, icon: "shirt", tint: "green",   spark: [3, 5, 4, 6, 4, 7, 9] },
    { name: "Pashmina Shawl — Maroon",  units: 18, rev: 44100, icon: "shirt", tint: "red",     spark: [2, 3, 2, 4, 5, 6, 6] },
    { name: "Brass Diyo (pair)",        units: 15, rev: 20250, icon: "home",  tint: "gold",    spark: [4, 4, 3, 5, 4, 4, 5] },
    { name: "Dhaka Topi — Classic",     units: 12, rev: 10200, icon: "shirt", tint: "blue",    spark: [1, 2, 3, 3, 4, 2, 3] },
    { name: "Lokta Paper Journal",      units:  8, rev:  5200, icon: "book",  tint: "gold",    spark: [2, 1, 1, 2, 1, 2, 1] },
  ];

  const activity = [
    { t: "2 min ago",  icon: "package", color: "var(--red)",     text: "New order from Sarita Thapa, Lalitpur — Rs. 1,200" },
    { t: "14 min ago", icon: "package", color: "var(--red)",     text: "New order from Anjali Gurung, Pokhara — Rs. 2,900" },
    { t: "1 hr ago",   icon: "wallet",  color: "var(--success)", text: "Rs. 17,820 received in eSewa wallet" },
    { t: "3 hr ago",   icon: "truck",   color: "var(--blue)",    text: "Order BZ-24496 shipped via Pathao" },
    { t: "5 hr ago",   icon: "star",    color: "var(--gold)",    text: "Bikash Rai left a 5-star review" },
    { t: "yesterday",  icon: "zap",     color: "var(--saffron)", text: "Dhaka Topi running low — only 2 left" },
  ];

  const kpis = [
    { label: "Today's sales",         sub: "आजको बिक्री",        value: "Rs. 24,000", delta: "+12%",  up: true,  color: "var(--blue)",    spark: [10,12,9,14,11,18,24] },
    { label: "Orders to pack",        sub: "प्याक गर्न बाँकी",    value: "2",          delta: "new",   up: true,  color: "var(--danger)",  spark: [0,1,0,2,1,2,2] },
    { label: "Visitors who bought",   sub: "१०० मध्ये किनेकाहरू",  value: "3 of 100",   delta: "+1",    up: true,  color: "var(--saffron)", spark: [2,2,3,2,3,3,3] },
    { label: "Money on the way",      sub: "आउँदै",               value: "Rs. 38,200", delta: "2 days",up: true,  color: "var(--success)", spark: [12,18,9,21,14,18,38],
      couriers: [
        { name: "Pathao", amount: "Rs. 18,200", to: "s-inbox" },
        { name: "NCM",    amount: "Rs. 20,000", to: "s-inbox" },
      ] },
  ];

  const bargainGlance = { pending: 1, accepted: 4, avgGiven: 8, marginGiven: 1840 };

  const hourHeat = [
    [0,0,0,0,0,1,2,3,4,3,2,2,3,5,6,8,9,11,12,10,7,4,2,1],
    [0,0,0,0,0,1,2,4,5,4,3,3,4,6,8,10,12,14,13,10,6,3,1,1],
    [0,0,0,0,1,2,3,5,6,5,4,4,5,7,9,11,13,15,14,11,7,4,2,1],
    [0,0,0,0,0,1,2,3,4,3,3,3,4,6,7,9,10,12,11,9,6,3,1,0],
    [0,0,0,0,1,2,3,5,7,6,5,4,5,7,9,12,14,16,15,12,8,4,2,1],
    [0,0,0,0,1,2,4,6,8,7,6,5,6,8,10,13,15,18,17,13,9,5,2,1],
    [0,0,0,0,1,1,3,4,5,4,4,3,4,6,8,10,12,13,12,10,7,4,2,1],
  ];

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar tutorial onTutorial={() => setCoach(true)} />

      {/* Greeting + range */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Namaste, Pemba <span style={{ fontSize: "1.5rem" }}>🙏</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
            {today} · <span className="ne">बजारकोमा स्वागत छ</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ChipGroup options={[{value:"today",label:"Today"},{value:"week",label:"7 days"},{value:"month",label:"30 days"}]} value={range} onChange={setRange} />
        </div>
      </div>

      {/* KPI strip — plain language, no jargon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 18 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-700)", fontWeight: 700 }}>{k.label}</div>
                <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-400)", fontWeight: 600 }}>{k.sub}</div>
              </div>
              <span style={{ fontSize: ".7rem", fontWeight: 800, color: k.up ? "var(--success)" : "var(--danger)", whiteSpace: "nowrap", marginLeft: 8 }}>
                {k.delta}
              </span>
            </div>
            <div className="tnum" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-900)", marginBottom: 4 }}>{k.value}</div>
            <SellerSparkline data={k.spark} color={k.color} />
            {k.couriers && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--line-200)", display: "flex", flexDirection: "column", gap: 6 }}>
                {k.couriers.map(c => (
                  <button key={c.name} onClick={() => nav(c.to)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "4px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".75rem", fontWeight: 700, color: "var(--ink-700)" }}>
                      <Icon name="truck" size={14} color="var(--blue)" />
                      {c.name}
                    </span>
                    <span className="tnum" style={{ fontSize: ".75rem", fontWeight: 800, color: "var(--ink-900)" }}>{c.amount}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hero earnings + tasks side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }} className="bz-seller-grid bz-stack-900">
        <div style={{ background: "linear-gradient(135deg, #0a2e6b 0%, #1e3a8a 100%)", borderRadius: "var(--r-lg)", padding: 26, color: "#fff", boxShadow: "var(--sh-2)" }}>
          <div className="ne" style={{ fontSize: ".875rem", opacity: .85, fontWeight: 600 }}>आजको कुल कमाइ · Earnings today</div>
          <div className="tnum bz-stat-xl" style={{ fontWeight: 800, margin: "6px 0 4px", letterSpacing: "-.02em" }}>Rs. 24,000</div>
          <div style={{ fontSize: ".875rem", opacity: .85, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={14} color="#86efac" /> <span className="ne">पैसा आयो</span> · Sent to eSewa
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
            {[
              { k: "Orders",  v: "12" },
              { k: "Avg. cart", v: "Rs. 2,000" },
              { k: "Returns",   v: "0" },
            ].map(s => (
              <div key={s.k} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: "var(--r-md)", padding: 12, textAlign: "center" }}>
                <div className="tnum" style={{ fontWeight: 800, fontSize: "1.125rem" }}>{s.v}</div>
                <div style={{ fontSize: ".75rem", opacity: .8 }}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line-200)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: ".9375rem", color: "var(--blue-deep)" }}>Today's tasks · आजको काम</div>
            <Chip tone="red" size="sm">3 to do</Chip>
          </div>
          {[
            { icon: "package", tint: "red",     label: "Accept 2 new orders",     ne: "२ नयाँ अर्डर",                       to: "s-inbox",    urgent: true,  action: { label: "Accept all", onAct: () => toast("Accepted 2 orders · २ अर्डर स्वीकार") } },
            { icon: "zap",     tint: "saffron", label: "3 items running low",     ne: "३ सामान कम छ",                       to: "s-products", urgent: false, action: { label: "Restock",    onAct: () => nav("s-products") } },
            { icon: "video",   tint: "blue",    label: "Add a product video",     ne: "भिडियो थप्नुहोस् — २x बिक्री बढ्छ", to: "s-add",      urgent: false, action: { label: "Record",     onAct: () => nav("s-videos") } },
          ].map(t => (
            <div key={t.label} role="button" tabIndex={0}
              onClick={() => nav(t.to)}
              onKeyDown={(e) => { if (e.key === "Enter") nav(t.to); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", borderTop: "1px solid var(--line-200)", cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: TINTS[t.tint][0], color: TINTS[t.tint][2], display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
                <Icon name={t.icon} size={20} color={TINTS[t.tint][2]} />
                {t.urgent && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "var(--danger)", border: "2px solid #fff" }} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".875rem" }}>{t.label}</div>
                <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>{t.ne}</div>
              </div>
              {t.action ? (
                <button
                  onClick={(e) => { e.stopPropagation(); t.action.onAct(); }}
                  style={{
                    flexShrink: 0, height: 32, padding: "0 12px",
                    background: t.urgent ? "var(--red)" : "#fff",
                    color: t.urgent ? "#fff" : "var(--blue)",
                    border: t.urgent ? "1.5px solid var(--red)" : "1.5px solid var(--blue)",
                    borderRadius: "var(--r-md)", fontWeight: 800, fontSize: ".75rem",
                    cursor: "pointer", whiteSpace: "nowrap"
                  }}>
                  {t.action.label}
                </button>
              ) : (
                <Icon name="chevronRight" size={18} color="var(--ink-400)" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Analytics grid: chart + payment donut */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }} className="bz-seller-grid bz-stack-900">
        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Sales trend</h3>
              <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>७ दिनको बिक्री</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: ".75rem", fontWeight: 700, color: "var(--ink-500)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--blue)" }} />Sales</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--red)" }} />Today</span>
            </div>
          </div>
          <SellerBarChart data={salesByDay} height={200} />
        </div>

        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Bargaining</h3>
            <Button variant="ghost" size="sm" onClick={() => nav("s-bargain")} iconRight="chevronRight">Open</Button>
          </div>
          {bargainGlance.pending > 0 && (
            <button onClick={() => nav("s-bargain")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--tint-red-50)", border: "1.5px solid var(--red)", borderRadius: "var(--r-md)", cursor: "pointer", marginBottom: 12, textAlign: "left" }}>
              <Icon name="bargain" size={22} color="var(--red)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "var(--red)", fontSize: ".875rem" }}>{bargainGlance.pending} offer waiting</div>
                <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>१ मोलतोल बाँकी</div>
              </div>
              <Icon name="chevronRight" size={18} color="var(--red)" />
            </button>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: 10, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)" }}>
              <div className="tnum" style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--success)" }}>{bargainGlance.accepted}</div>
              <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Accepted today</div>
            </div>
            <div style={{ padding: 10, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)" }}>
              <div className="tnum" style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--saffron)" }}>{bargainGlance.avgGiven}%</div>
              <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Avg discount</div>
            </div>
            <div style={{ padding: 10, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)", gridColumn: "1 / -1" }}>
              <div className="tnum" style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink-900)" }}>Rs. {bargainGlance.marginGiven.toLocaleString()}</div>
              <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Margin given via bargain (this week)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hour-of-day heatmap — when buyers visit your store */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Best time to post</h3>
            <p style={{ margin: "2px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>When visitors check your store. Darker = more visitors.</p>
          </div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Low <span style={{ display: "inline-flex", gap: 2 }}>
              {[0,0.25,0.5,0.75,1].map(o => <span key={o} style={{ width: 14, height: 12, background: `rgba(29,78,216,${0.08 + o * 0.7})`, borderRadius: 2 }} />)}
            </span> High
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "inline-grid", gridTemplateColumns: "auto repeat(24, minmax(20px, 1fr))", gap: 3, minWidth: "100%" }}>
            <div></div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} style={{ fontSize: ".6rem", color: "var(--ink-400)", textAlign: "center", fontWeight: 700 }}>{h % 6 === 0 ? `${h}` : ""}</div>
            ))}
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, di) => (
              <Fragment key={d}>
                <div style={{ fontSize: ".7rem", color: "var(--ink-500)", fontWeight: 700, paddingRight: 6, alignSelf: "center" }}>{d}</div>
                {hourHeat[di].map((v, hi) => {
                  const o = Math.min(v / 18, 1);
                  return <div key={hi} title={`${d} ${hi}:00 — ${v} visits`} style={{ height: 18, background: `rgba(29,78,216,${0.08 + o * 0.7})`, borderRadius: 2 }} />;
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <p style={{ marginTop: 12, fontSize: ".8125rem", color: "var(--blue-deep)", background: "var(--tint-blue-50)", padding: "8px 12px", borderRadius: "var(--r-md)" }}>
          <Icon name="badgeCheck" size={14} color="var(--blue)" style={{ verticalAlign: "middle", marginRight: 6 }} />
          Fri 5–7pm gets the most visits. Post new items just before this window.
        </p>
      </div>

      {/* Funnel + activity */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }} className="bz-seller-grid">
        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Buyer journey</h3>
          <p style={{ margin: "0 0 16px", fontSize: ".75rem", color: "var(--ink-500)" }}>This week — where buyers drop off</p>
          <SellerFunnel rows={funnel} />
          <div style={{ marginTop: 14, background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", padding: 10, fontSize: ".8125rem", color: "var(--blue-deep)" }}>
            <Icon name="badgeCheck" size={14} color="var(--blue)" style={{ verticalAlign: "middle", marginRight: 4 }} />
            55% of carts don't reach checkout — add video to top products to lift this.
          </div>
        </div>

        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Recent activity · हालैको</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 320, overflowY: "auto" }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < activity.length - 1 ? "1px dashed var(--line-200)" : "none" }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--line-100)", color: a.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={a.icon} size={16} color={a.color} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".875rem", color: "var(--ink-900)", lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-400)", marginTop: 2 }}>{a.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products table */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Top products · मनपर्ने सामान</h3>
          <Button variant="ghost" size="sm" onClick={() => nav("s-products")} iconRight="chevronRight">See all</Button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--line-200)" }}>
              {["Product", "Units sold", "Revenue", "Trend"].map(h => (
                <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: ".7rem", fontWeight: 700, color: "var(--ink-500)", letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.map(p => (
              <tr key={p.name} style={{ borderBottom: "1px dashed var(--line-200)" }}>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Placeholder icon={p.icon} tint={p.tint} style={{ width: 40, height: 40 }} radius="var(--r-sm)" />
                    <span style={{ fontWeight: 700, fontSize: ".875rem" }}>{p.name}</span>
                  </div>
                </td>
                <td className="tnum" style={{ padding: "12px 8px", fontWeight: 700 }}>{p.units}</td>
                <td className="tnum" style={{ padding: "12px 8px", fontWeight: 800, color: "var(--success)" }}>Rs. {p.rev.toLocaleString()}</td>
                <td style={{ padding: "12px 8px", width: 120 }}>
                  <SellerSparkline data={p.spark} color="var(--blue)" height={24} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick actions strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { icon: "plus",    label: "Add product", ne: "थप्नुहोस्",     tint: "green",   to: "s-add" },
          { icon: "package", label: "Orders",      ne: "अर्डर",         tint: "red",     to: "s-inbox",    badge: "2" },
          { icon: "store",   label: "My products", ne: "मेरो सामान",     tint: "blue",    to: "s-products" },
          { icon: "wallet",  label: "Payouts",     ne: "भुक्तानी",       tint: "saffron", to: "s-ledger" },
        ].map(a => (
          <button key={a.label} onClick={() => nav(a.to)}
            style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", position: "relative" }}>
            <span style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: TINTS[a.tint][0], color: TINTS[a.tint][2], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={a.icon} size={22} color={TINTS[a.tint][2]} />
            </span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: ".9375rem" }}>{a.label}</div>
              <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{a.ne}</div>
            </div>
            {a.badge && (
              <span style={{ minWidth: 22, height: 22, padding: "0 6px", borderRadius: 999, background: "var(--danger)", color: "#fff", fontSize: ".75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Trust strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, padding: 18, background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)" }}>
        {[
          { k: "Orders this week", v: "47",   c: "var(--blue-deep)" },
          { k: "Store rating",     v: "4.8 ★", c: "var(--gold)" },
          { k: "On-time ship",     v: "98%",  c: "var(--success)" },
          { k: "Repeat buyers",    v: "32%",  c: "var(--saffron)" },
        ].map(s => (
          <div key={s.k} style={{ textAlign: "center" }}>
            <div className="tnum" style={{ fontWeight: 800, fontSize: "1.5rem", color: s.c }}>{s.v}</div>
            <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{s.k}</div>
          </div>
        ))}
      </div>

      {coach && <SellerCoachmark steps={COACH_DASHBOARD} onDone={() => setCoach(false)} />}
    </div>
  );
}

/* ---------- 4.3 Orders Inbox (Viber-style feed) ---------- */
export const INBOX_ORDERS = [
  { id: "BZ-24512", buyer: "Sarita Thapa",   city: "Lalitpur",   item: "Green Cotton Kurtha — Size XL",  qty: 1, price: 1200, pay: "Cash on Delivery", status: "new",     time: "2 min ago",   phone: "98XXXXXXXX", icon: "shirt", tint: "green" },
  { id: "BZ-24509", buyer: "Anjali Gurung",  city: "Pokhara",    item: "Tibetan Singing Bowl",            qty: 1, price: 2900, pay: "eSewa",            status: "new",     time: "14 min ago",  phone: "98XXXXXXXX", icon: "home",  tint: "gold" },
  { id: "BZ-24502", buyer: "Bikash Rai",     city: "Biratnagar", item: "Brass Diyo Oil Lamp (pair)",     qty: 2, price: 2700, pay: "COD",              status: "packed",  time: "1 hr ago",    phone: "98XXXXXXXX", icon: "home",  tint: "saffron" },
  { id: "BZ-24496", buyer: "Kabita Magar",   city: "Butwal",     item: "Handwoven Dhaka Cushion",         qty: 1, price: 1100, pay: "Khalti",           status: "shipped", time: "3 hr ago",    phone: "98XXXXXXXX", icon: "shirt", tint: "red" },
  { id: "BZ-24491", buyer: "Deepak Shah",    city: "Janakpur",   item: "Bluetooth Earbuds Pro",          qty: 1, price: 2990, pay: "Fonepay",          status: "new",     time: "22 min ago",  phone: "98XXXXXXXX", icon: "phone", tint: "slate" },
  { id: "BZ-24488", buyer: "Mina Tamang",    city: "Kathmandu",  item: "Himalayan Wool Socks (3 pk)",    qty: 3, price: 1350, pay: "COD",              status: "new",     time: "38 min ago",  phone: "98XXXXXXXX", icon: "shirt", tint: "blue" },
  { id: "BZ-24480", buyer: "Ramesh Adhikari",city: "Hetauda",    item: "Wild Mountain Honey 500g",       qty: 2, price: 1440, pay: "eSewa",            status: "packed",  time: "2 hr ago",    phone: "98XXXXXXXX", icon: "leaf",  tint: "gold" },
  { id: "BZ-24472", buyer: "Sunita Bhattarai",city: "Dharan",    item: "Ceramic Planter — Glazed",       qty: 1, price: 920,  pay: "IME Pay",          status: "packed",  time: "4 hr ago",    phone: "98XXXXXXXX", icon: "home",  tint: "teal" },
  { id: "BZ-24465", buyer: "Hari Bhandari",  city: "Nepalgunj",  item: "Smart Fitness Watch",            qty: 1, price: 3490, pay: "Card",             status: "shipped", time: "yesterday",   phone: "98XXXXXXXX", icon: "watch", tint: "blue" },
  { id: "BZ-24458", buyer: "Gita Karki",     city: "Lalitpur",   item: "Organic Argan Hair Serum",       qty: 2, price: 2500, pay: "Khalti",           status: "shipped", time: "yesterday",   phone: "98XXXXXXXX", icon: "sparkles", tint: "purple" },
  { id: "BZ-24450", buyer: "Prakash Limbu",  city: "Itahari",    item: "Leather Sling Bag",              qty: 1, price: 2350, pay: "COD",              status: "done",    time: "2 days ago",  phone: "98XXXXXXXX", icon: "tag",   tint: "saffron" },
  { id: "BZ-24442", buyer: "Laxmi Sapkota",  city: "Bharatpur",  item: "Felt Wool Slippers",             qty: 2, price: 1380, pay: "eSewa",            status: "done",    time: "3 days ago",  phone: "98XXXXXXXX", icon: "shirt", tint: "red" },
  { id: "BZ-24437", buyer: "Niraj Pandey",   city: "Pokhara",    item: "Stainless Steel Water Bottle",   qty: 4, price: 3120, pay: "Fonepay",          status: "done",    time: "4 days ago",  phone: "98XXXXXXXX", icon: "dumbbell", tint: "teal" },
  { id: "BZ-24429", buyer: "Sabina Rai",     city: "Kathmandu",  item: "Lokta Paper Journal",            qty: 3, price: 1950, pay: "COD",              status: "done",    time: "5 days ago",  phone: "98XXXXXXXX", icon: "book",  tint: "gold" },
  { id: "BZ-24420", buyer: "Bishal Thapa",   city: "Birgunj",    item: "Thanka Painting — Mandala",      qty: 1, price: 5500, pay: "Card",             status: "done",    time: "6 days ago",  phone: "98XXXXXXXX", icon: "palette", tint: "purple" },
  { id: "BZ-24412", buyer: "Pratima Joshi",  city: "Damak",      item: "Allo Nettle Fibre Scarf",        qty: 2, price: 2400, pay: "Khalti",           status: "shipped", time: "yesterday",   phone: "98XXXXXXXX", icon: "palette", tint: "green" },
  { id: "BZ-24405", buyer: "Suresh Khadka",  city: "Tulsipur",   item: "Brass Singing Bell",             qty: 1, price: 1650, pay: "eSewa",            status: "packed",  time: "5 hr ago",    phone: "98XXXXXXXX", icon: "home",  tint: "gold" },
];

export const INBOX_TONE = { new: "red", packed: "saffron", shipped: "blue", done: "success" };
export const INBOX_LABEL = {
  new:     { en: "New order",  ne: "नयाँ अर्डर",      icon: "package" },
  packed:  { en: "Packed",     ne: "प्याक भयो",       icon: "package" },
  shipped: { en: "Shipped",    ne: "पठाइयो",          icon: "truck"   },
  done:    { en: "Delivered",  ne: "पुग्यो",          icon: "check"   },
};

export function OrderCard({ o, onOpen }) {
  const lbl = INBOX_LABEL[o.status];
  const tone = INBOX_TONE[o.status];
  return (
    <button onClick={() => onOpen(o)}
      style={{ background: "#fff", border: `1.5px solid ${o.status === "new" ? "var(--danger)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)", padding: 12, textAlign: "left", cursor: "pointer", width: "100%", display: "flex", gap: 10 }}>
      <Placeholder icon={o.icon} tint={o.tint} style={{ width: 56, height: 56, flexShrink: 0 }} radius="var(--r-md)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Chip tone={tone} size="sm" icon={lbl.icon}>{lbl.en}</Chip>
          <span style={{ fontSize: ".68rem", color: "var(--ink-400)", marginLeft: "auto" }}>{o.time}</span>
        </div>
        <div style={{ fontWeight: 800, color: "var(--ink-900)", fontSize: ".875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.buyer}</div>
        <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 1 }}>{o.city} · {o.item.slice(0, 30)}</div>
        <div className="tnum" style={{ fontSize: ".875rem", color: "var(--blue-deep)", fontWeight: 800, marginTop: 4 }}>Rs. {o.price.toLocaleString()}</div>
      </div>
    </button>
  );
}

export const INBOX_DATE_RANGES = [
  { id: "all",   label: "All" },
  { id: "today", label: "Today" },
  { id: "7d",    label: "7 days" },
  { id: "30d",   label: "30 days" },
];

export function inDateRange(o, range) {
  if (range === "all") return true;
  // Time strings in mock data: "2 min ago", "1 hr ago", "3 hr ago", "yesterday", "2 days ago".
  const t = o.time.toLowerCase();
  const isToday   = t.includes("min") || t.includes("hr");
  const isThisWeek = isToday || t.includes("yesterday") || /^[1-6] days?/.test(t);
  if (range === "today") return isToday;
  if (range === "7d")    return isThisWeek;
  return true; // 30d catches everything in mock
}

export function SellerInbox() {
  const { nav } = useBz();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("list"); // list | kanban
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");

  const q = search.trim().toLowerCase();
  const baseFiltered = INBOX_ORDERS.filter(o => {
    if (q && !(`${o.id} ${o.buyer} ${o.city} ${o.item}`.toLowerCase().includes(q))) return false;
    if (!inDateRange(o, range)) return false;
    return true;
  });
  const counts = {
    all:     baseFiltered.length,
    new:     baseFiltered.filter(o => o.status === "new").length,
    packed:  baseFiltered.filter(o => o.status === "packed").length,
    shipped: baseFiltered.filter(o => o.status === "shipped").length,
    done:    baseFiltered.filter(o => o.status === "done").length,
  };
  const list = baseFiltered.filter(o => tab === "all" || o.status === tab);
  const openOrder = (o) => { sellerOrderRef.current = o; nav("s-order-detail"); };
  const filtersActive = search.trim() || range !== "all" || tab !== "all";
  const clearFilters = () => { setSearch(""); setRange("all"); setTab("all"); };
  const ordersPaged = usePages(list, 8, `${tab}|${q}|${range}`);

  const tabs = [
    { id: "all",     label: "All" },
    { id: "new",     label: "New",     tone: "red" },
    { id: "packed",  label: "Packing", tone: "saffron" },
    { id: "shipped", label: "Shipped", tone: "blue" },
    { id: "done",    label: "Delivered", tone: "success" },
  ];

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Orders <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· अर्डर</span>
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>Tap an order to print labels, message buyer, or update status.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setView(v => v === "list" ? "kanban" : "list")}
            className="bz-mobile-hide"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontWeight: 700, fontSize: ".8125rem", cursor: "pointer", color: "var(--ink-700)" }}>
            <Icon name={view === "list" ? "kanban" : "layout"} size={16} />
            {view === "list" ? "Board view" : "List view"}
          </button>
        </div>
      </div>

      {/* Search + date range */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1 1 240px", position: "relative", minWidth: 200 }}>
          <Icon name="search" size={16} color="var(--ink-400)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, buyer, or item"
            style={{ width: "100%", padding: "10px 12px 10px 36px", height: 40, border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontSize: ".875rem", background: "#fff", color: "var(--ink-900)", outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "var(--r-full)", border: "none", background: "var(--line-200)", color: "var(--ink-700)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="x" size={12} color="var(--ink-700)" />
            </button>
          )}
        </div>
        <div style={{ display: "inline-flex", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-full)", overflow: "hidden", background: "#fff" }}>
          {INBOX_DATE_RANGES.map((r, i) => (
            <button key={r.id} onClick={() => setRange(r.id)} aria-pressed={range === r.id}
              style={{ padding: "8px 14px", minHeight: 40, border: "none", cursor: "pointer",
                background: range === r.id ? "var(--blue-deep)" : "transparent",
                color: range === r.id ? "#fff" : "var(--ink-700)",
                fontWeight: 700, fontSize: ".8125rem", whiteSpace: "nowrap",
                borderLeft: i === 0 ? "none" : "1px solid var(--line-200)" }}>
              {r.label}
            </button>
          ))}
        </div>
        {filtersActive && (
          <button onClick={clearFilters}
            style={{ height: 40, padding: "0 14px", border: "none", background: "none", color: "var(--ink-500)", fontWeight: 700, fontSize: ".8125rem", cursor: "pointer", textDecoration: "underline" }}>
            Clear
          </button>
        )}
      </div>

      {/* Status tabs with counts */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {tabs.map(t => {
          const c = counts[t.id];
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: active ? "var(--ink-900)" : "#fff", color: active ? "#fff" : "var(--ink-700)",
                border: `1.5px solid ${active ? "var(--ink-900)" : "var(--line-200)"}`, borderRadius: 999,
                cursor: "pointer", fontWeight: 700, fontSize: ".8125rem", whiteSpace: "nowrap" }}>
              {t.label}
              <span className="tnum" style={{ background: active ? "rgba(255,255,255,.2)" : "var(--line-100)", padding: "1px 8px", borderRadius: 999, fontSize: ".7rem", fontWeight: 800 }}>{c}</span>
            </button>
          );
        })}
      </div>

      {view === "kanban" ? (
        <div className="bz-kanban">
          {["new", "packed", "shipped", "done"].map(col => {
            const lbl = INBOX_LABEL[col];
            const tone = INBOX_TONE[col];
            const items = baseFiltered.filter(o => o.status === col);
            return (
              <div key={col} style={{ background: "var(--line-100)", borderRadius: "var(--r-lg)", padding: 10, minHeight: 200 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 10px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: ".875rem", color: "var(--ink-900)" }}>
                    <Icon name={lbl.icon} size={16} color={`var(--${tone === "success" ? "success" : tone})`} />
                    {lbl.en}
                  </span>
                  <span className="tnum" style={{ background: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: ".7rem", fontWeight: 800 }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--ink-400)", fontSize: ".8125rem" }}>None</div>}
                  {items.map(o => <OrderCard key={o.id} o={o} onOpen={openOrder} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-500)" }}>
                <Icon name="package" size={48} color="var(--ink-300)" />
                <p style={{ marginTop: 12 }}>No orders here yet</p>
              </div>
            )}
            {ordersPaged.visible.map(o => <OrderCard key={o.id} o={o} onOpen={openOrder} />)}
          </div>
          {list.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 16 }}>
              <PageBar page={ordersPaged.page} pageCount={ordersPaged.pageCount} onPage={ordersPaged.goPage} alwaysShow />
              <div className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}>
                Showing {ordersPaged.from}–{ordersPaged.to} of {ordersPaged.total} orders
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- 4.3b Order detail — full-screen, one big action ---------- */
export function SellerOrderDetail() {
  const { nav, toast } = useBz();
  const o = sellerOrderRef.current || INBOX_ORDERS[0];
  const [busy, setBusy] = useState(false);

  const accept = () => {
    setBusy(true);
    setTimeout(() => { toast(`Order ${o.id} accepted — pack and call rider`); nav("s-inbox"); }, 600);
  };
  const reject = () => {
    if (window.confirm("Tell the buyer you can't fulfill this order? · अर्डर रद्द गर्ने?")) {
      toast("Marked out of stock — buyer refunded");
      nav("s-inbox");
    }
  };

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <SellerHelpBar />

      <button onClick={() => nav("s-inbox")} style={{ background: "none", border: "none", color: "var(--ink-500)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: ".875rem" }}>
        <Icon name="chevronLeft" size={16} /> Back to orders
      </button>

      <div style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)", border: "2px solid var(--danger)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <Icon name="package" size={32} color="var(--danger)" />
        <div>
          <div style={{ fontWeight: 800, color: "var(--danger)", fontSize: "1rem" }}>New order · नयाँ अर्डर</div>
          <div style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>{o.time} · Order #{o.id}</div>
        </div>
      </div>

      {/* Buyer */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Buyer · खरिदकर्ता</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--tint-blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem" }}>
            {o.buyer[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{o.buyer}</div>
            <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>{o.city}</div>
          </div>
          <a href={`tel:${o.phone}`} style={{ width: 48, height: 48, borderRadius: "50%", background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Icon name="phone" size={22} color="#fff" />
          </a>
        </div>
      </div>

      {/* Item */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Item · सामान</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Placeholder icon={o.icon} tint={o.tint} style={{ width: 70, height: 70 }} radius="var(--r-md)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{o.item}</div>
            <div className="tnum" style={{ fontSize: ".875rem", color: "var(--ink-500)", marginTop: 2 }}>Qty {o.qty}</div>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Payment · भुक्तानी</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: "var(--ink-700)" }}>Buyer pays</span>
          <span className="tnum" style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--blue-deep)" }}>Rs. {o.price.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: ".875rem" }}>
          <span style={{ color: "var(--ink-500)" }}>Platform fee (2%)</span>
          <span className="tnum" style={{ color: "var(--danger)", fontWeight: 700 }}>− Rs. {Math.round(o.price * 0.02)}</span>
        </div>
        <div style={{ paddingTop: 10, borderTop: "1px dashed var(--line-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>You get · तपाईंलाई</span>
          <span className="tnum" style={{ fontWeight: 800, fontSize: "1.375rem", color: "var(--success)" }}>Rs. {(o.price - Math.round(o.price * 0.02)).toLocaleString()}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--ink-500)" }}>Method: {o.pay}</div>
      </div>

      {/* ONE BIG ACTION */}
      <Button variant="primary" size="lg" full loading={busy} onClick={accept} icon="check">
        Accept order · स्वीकार गर्नुहोस्
      </Button>
      <Button variant="danger" full onClick={reject} style={{ marginTop: 10 }}>
        Can't fulfill · पूरा गर्न सक्दिनँ
      </Button>

      {/* Print actions */}
      <div style={{ marginTop: 16, padding: 14, background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)" }}>
        <div style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Print · प्रिन्ट</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { icon: "printer", en: "Shipping label", ne: "लेबल",      msg: "Pathao label generated — print or share PDF" },
            { icon: "file",    en: "Invoice",        ne: "बिल",       msg: "Invoice PDF ready" },
            { icon: "filePlus",en: "Packing slip",   ne: "प्याकिङ",   msg: "Packing slip ready" },
          ].map(p => (
            <button key={p.en} onClick={() => toast(p.msg)}
              style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Icon name={p.icon} size={22} color="var(--blue)" />
              <div style={{ fontWeight: 700, fontSize: ".75rem", color: "var(--ink-900)" }}>{p.en}</div>
              <div className="ne" style={{ fontSize: ".65rem", color: "var(--ink-500)" }}>{p.ne}</div>
            </button>
          ))}
        </div>
        <p style={{ marginTop: 10, fontSize: ".75rem", color: "var(--ink-500)" }}>
          Courier:&nbsp;
          <select defaultValue="pathao" style={{ border: "1px solid var(--line-200)", borderRadius: 6, padding: "2px 6px", fontFamily: "var(--font-sans)" }}>
            <option value="pathao">Pathao</option>
            <option value="aramex">Aramex</option>
            <option value="sajilo">Sajilo Logistics</option>
            <option value="self">Self-delivery</option>
          </select>
        </p>
      </div>

      <div style={{ marginTop: 18, background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", padding: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon name="badgeCheck" size={18} color="var(--blue)" />
        <div style={{ fontSize: ".8125rem", color: "var(--blue-deep)" }}>
          <b>What happens next?</b><br />
          After you accept, pack the item. We'll send a rider. Money lands in your wallet within 24 hrs.
        </div>
      </div>
      </div>
    </div>
  );
}

/* ---------- 4.4a Category-specific attribute fields ---------- */
export function CategoryAttrFields({ category, values, onChange }) {
  const fields = CATEGORY_ATTRIBUTES[category] || [];
  if (!fields.length) return null;
  const inputStyle = { width: "100%", height: 48, fontSize: ".9375rem", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "0 14px", outline: "none", background: "#fff", fontFamily: "var(--font-sans)" };
  const set = (k, v) => onChange({ ...values, [k]: v });
  const toggleMulti = (k, opt) => {
    const cur = Array.isArray(values[k]) ? values[k] : [];
    set(k, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map(f => (
        <div key={f.k}>
          <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {f.en} <span className="ne" style={{ fontWeight: 600, color: "var(--ink-400)" }}>· {f.ne}</span>
            {f.req && <span style={{ color: "var(--red)", fontWeight: 800 }} title="Required">*</span>}
            {f.u && <span style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: ".75rem" }}>({f.u})</span>}
          </label>

          {f.t === "select" && (
            <select value={values[f.k] || ""} onChange={e => set(f.k, e.target.value)} style={inputStyle}>
              <option value="">Choose…</option>
              {f.o.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}

          {f.t === "multi" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {f.o.map(o => {
                const on = (values[f.k] || []).includes(o);
                return (
                  <button key={o} type="button" onClick={() => toggleMulti(f.k, o)} aria-pressed={on}
                    style={{ padding: "10px 14px", borderRadius: "var(--r-full)", cursor: "pointer", fontWeight: 700, fontSize: ".8125rem", minHeight: 44,
                      border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`, background: on ? "var(--tint-blue-50)" : "#fff",
                      color: on ? "var(--blue)" : "var(--ink-500)" }}>
                    {on ? "✓ " : ""}{o}
                  </button>
                );
              })}
            </div>
          )}

          {(f.t === "text" || f.t === "num") && (
            <input value={values[f.k] || ""} inputMode={f.t === "num" ? "numeric" : undefined}
              onChange={e => set(f.k, f.t === "num" ? e.target.value.replace(/\D/g, "") : e.target.value)}
              placeholder="Type here" style={inputStyle} />
          )}

          {f.t === "date" && (
            <input type="date" value={values[f.k] || ""} onChange={e => set(f.k, e.target.value)} style={inputStyle} />
          )}

          {f.t === "toggle" && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: ".875rem", color: "var(--ink-700)", fontWeight: 600 }}>
              <input type="checkbox" checked={!!values[f.k]} onChange={e => set(f.k, e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--blue)" }} />
              Yes · हो
            </label>
          )}

          {f.help && <p style={{ fontSize: ".75rem", color: "var(--ink-400)", margin: "6px 0 0" }}>{f.help}</p>}
        </div>
      ))}
    </div>
  );
}

// Has the seller filled an attribute field? (multi=any selected, toggle=true, else non-empty)
export const attrFilled = (f: { t: string }, v: unknown) => {
  if (f.t === "multi") return Array.isArray(v) && v.length > 0;
  if (f.t === "toggle") return v === true;
  return !!v && (typeof v !== "string" || v.trim() !== "");
};

/* ---------- 4.4 Add Product — Three-Tap Listing ---------- */
export function SellerAddProduct() {
  const { nav, toast } = useBz();
  const [photos, setPhotos] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([
    { id: 1, name: "Small",  price: "", stock: "" },
    { id: 2, name: "Medium", price: "", stock: "" },
    { id: 3, name: "Large",  price: "", stock: "" },
  ]);
  const [bargainOk, setBargainOk] = useState(true);
  const [bargainPct, setBargainPct] = useState(10);
  const [attrs, setAttrs] = useState({});

  // New category → start its attributes fresh (never carry the wrong category's fields).
  const pickCategory = (id) => { setCategory(id); setAttrs({}); };

  const attrFields = CATEGORY_ATTRIBUTES[category] || [];
  const reqFields = attrFields.filter(f => f.req);
  const missingReq = reqFields.filter(f => !attrFilled(f, attrs[f.k]));
  const filledCount = attrFields.filter(f => attrFilled(f, attrs[f.k])).length;
  const quality = attrFields.length === 0 ? null
    : (missingReq.length === 0 && filledCount >= Math.ceil(attrFields.length * 0.7)) ? { label: "Excellent listing", ne: "उत्कृष्ट", pct: 100, color: "var(--success)" }
    : (missingReq.length === 0) ? { label: "Good listing", ne: "राम्रो", pct: 70, color: "var(--blue)" }
    : { label: "Basic listing", ne: "साधारण", pct: 35, color: "var(--saffron)" };

  // Demo AI auto-tag: fill empty attributes from "photos" (prototype — picks sensible defaults).
  const aiFill = () => {
    const next = { ...attrs };
    attrFields.forEach(f => {
      if (attrFilled(f, next[f.k])) return;
      if (f.t === "select" && f.o) next[f.k] = f.o[0];
      else if (f.t === "multi" && f.o) next[f.k] = [f.o[0]];
      else if (f.t === "toggle") next[f.k] = true;
    });
    setAttrs(next);
    toast("Details filled from your photos — please check · जाँच गर्नुहोस्");
  };

  const titleOk = title.trim().length >= 3;
  const variantsOk = !hasVariants || variants.every(v => v.price && v.stock);
  const canPublish = photos > 0 && titleOk && (hasVariants ? variantsOk : (price && stock));

  const updateVariant = (id, key, val) => setVariants(arr => arr.map(v => v.id === id ? { ...v, [key]: val } : v));
  const addVariant = () => setVariants(arr => [...arr, { id: Date.now(), name: "", price: "", stock: "" }]);
  const removeVariant = (id) => setVariants(arr => arr.filter(v => v.id !== id));

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <SellerHelpBar />

      <button onClick={() => nav("s-dashboard")} style={{ background: "none", border: "none", color: "var(--ink-500)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: ".875rem" }}>
        <Icon name="chevronLeft" size={16} /> Back to dashboard
      </button>

      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Add a product</h1>
      <p className="ne" style={{ color: "var(--ink-500)", margin: "4px 0 12px" }}>३ ट्यापमा सामान थप्नुहोस्</p>

      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {[photos > 0, titleOk, hasVariants ? variantsOk : (price && stock)].map((done, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: done ? "var(--success)" : "var(--line-200)" }} />
        ))}
      </div>

      {/* Step 1 — Photos */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: photos > 0 ? "var(--success)" : "var(--saffron)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
            {photos > 0 ? <Icon name="check" size={18} color="#fff" /> : 1}
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Take 3 photos</h3>
            <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>३ फोटो खिच्नुहोस्</div>
          </div>
        </div>
        <button onClick={() => setPhotos(p => Math.min(p + 1, 3))}
          style={{ width: "100%", padding: 22, background: "rgba(247,127,0,.08)", border: "1.5px dashed var(--saffron)", borderRadius: "var(--r-md)",
            color: "var(--saffron)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: "1rem" }}>
          <Icon name="image" size={26} color="var(--saffron)" />
          {photos === 0 ? "Open camera · क्यामेरा खोल्नुहोस्" : `${photos}/3 photos · tap for next`}
        </button>
        {photos > 0 && (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {Array.from({ length: photos }).map((_, i) => (
                <Placeholder key={i} icon="shirt" tint="green" style={{ width: 70, height: 70 }} radius="var(--r-sm)" />
              ))}
            </div>
            <p style={{ fontSize: ".8125rem", color: "var(--success)", marginTop: 10 }}>
              <Icon name="check" size={14} color="var(--success)" style={{ verticalAlign: "middle" }} /> Background auto-removed · पृष्ठभूमि हटाइयो
            </p>
          </>
        )}
      </div>

      {/* Step 2 — Describe */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: titleOk ? "var(--success)" : "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
            {titleOk ? <Icon name="check" size={18} color="#fff" /> : 2}
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Describe your product</h3>
            <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>सामानको बारेमा लेख्नुहोस्</div>
          </div>
        </div>

        <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 6 }}>Product name · नाम</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Green cotton kurta — size XL"
          style={{ width: "100%", height: 56, fontSize: "1rem", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "0 16px", outline: "none", fontFamily: "var(--font-sans)", marginBottom: 12 }} />

        <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 6 }}>Category · वर्ग</label>
        <select value={category} onChange={e => pickCategory(e.target.value)}
          style={{ width: "100%", height: 56, fontSize: "1rem", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "0 14px", outline: "none", background: "#fff", fontFamily: "var(--font-sans)" }}>
          <option value="">Pick a category</option>
          {ATTR_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.en} · {c.ne}</option>
          ))}
        </select>
        <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>Picking the right category shows buyers the right details — and helps them find you.</p>
      </div>

      {/* Product details — category-specific, optional but boosts findability */}
      {category && attrFields.length > 0 && (
        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--tint-blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="sliders" size={18} color="var(--blue)" />
            </span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Product details <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>Optional · ऐच्छिक</span></h3>
              <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>विवरण भर्नुहोस् — किनेर फिर्ता आउने सम्भावना घट्छ</div>
            </div>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
            More detail = buyers find you in filters and get fewer surprises (fewer returns). <span style={{ color: "var(--red)", fontWeight: 800 }}>*</span> = important.
          </p>

          {/* AI auto-fill from photos */}
          <button type="button" onClick={photos > 0 ? aiFill : undefined} disabled={photos === 0}
            style={{ width: "100%", padding: "12px 14px", marginBottom: 16, borderRadius: "var(--r-md)", cursor: photos > 0 ? "pointer" : "default",
              border: "1.5px solid var(--blue)", background: photos > 0 ? "var(--tint-blue-50)" : "var(--line-100)",
              color: photos > 0 ? "var(--blue)" : "var(--ink-400)", fontWeight: 700, fontSize: ".875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="sparkles" size={16} color={photos > 0 ? "var(--blue)" : "var(--ink-400)"} />
            {photos > 0 ? "Auto-fill from my photos · फोटोबाट भर्नुहोस्" : "Add photos first to auto-fill"}
          </button>

          <CategoryAttrFields category={category} values={attrs} onChange={setAttrs} />

          {/* Listing quality + missing warning */}
          {quality && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line-200)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)" }}>Listing quality · स्तर</span>
                <span style={{ fontSize: ".8125rem", fontWeight: 800, color: quality.color }}>{quality.label} · {quality.ne}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "var(--line-200)", overflow: "hidden" }}>
                <div style={{ width: `${quality.pct}%`, height: "100%", background: quality.color, borderRadius: 999 }} />
              </div>
              {missingReq.length > 0 && (
                <div style={{ margin: "12px 0 0", padding: "10px 12px", borderRadius: "var(--r-md)", background: "rgba(247,127,0,.08)", borderLeft: "3px solid var(--saffron)", fontSize: ".8125rem", color: "var(--ink-700)" }}>
                  You can still publish now, but adding <b>{missingReq.map(f => f.en).join(", ")}</b> helps buyers trust and find this product.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Price & stock (or variants) */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: (hasVariants ? variantsOk : (price && stock)) ? "var(--success)" : "var(--ink-400)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
            {(hasVariants ? variantsOk : (price && stock)) ? <Icon name="check" size={18} color="#fff" /> : 3}
          </span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Price &amp; stock</h3>
            <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>मूल्य र संख्या</div>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", cursor: "pointer" }}>
            <input type="checkbox" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--red)" }} />
            Has sizes/colors
          </label>
        </div>

        {!hasVariants ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 6 }}>Price (Rs.) · मूल्य</label>
              <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="1200"
                className="tnum" style={{ width: "100%", height: 64, fontSize: "1.5rem", fontWeight: 800, textAlign: "center", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 6 }}>Stock · संख्या</label>
              <input value={stock} onChange={e => setStock(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="15"
                className="tnum" style={{ width: "100%", height: 64, fontSize: "1.5rem", fontWeight: 800, textAlign: "center", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", outline: "none" }} />
            </div>
          </div>
        ) : (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: ".8125rem", color: "var(--ink-500)" }}>Add one row per variant (e.g. size, color).</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {variants.map(v => (
                <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                  <input value={v.name} onChange={e => updateVariant(v.id, "name", e.target.value)} placeholder="Variant (e.g. Large, Red)"
                    style={{ height: 48, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", outline: "none" }} />
                  <input value={v.price} onChange={e => updateVariant(v.id, "price", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Price"
                    className="tnum" style={{ height: 48, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", outline: "none", textAlign: "center" }} />
                  <input value={v.stock} onChange={e => updateVariant(v.id, "stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Stock"
                    className="tnum" style={{ height: 48, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", outline: "none", textAlign: "center" }} />
                  <button onClick={() => removeVariant(v.id)} disabled={variants.length <= 1}
                    style={{ width: 40, height: 40, borderRadius: "var(--r-md)", border: "1.5px solid var(--line-200)", background: "#fff", cursor: variants.length <= 1 ? "default" : "pointer", color: "var(--danger)", opacity: variants.length <= 1 ? .3 : 1 }}>
                    <Icon name="trash" size={16} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" icon="plus" onClick={addVariant} style={{ marginTop: 10 }}>Add another</Button>
          </div>
        )}
      </div>

      {/* Step 4 — Bargaining (optional) */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--tint-red-50)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bargain" size={18} color="var(--red)" />
          </span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Allow bargaining? <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>Optional</span></h3>
            <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>मोलतोल स्वीकार?</div>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={bargainOk} onChange={e => setBargainOk(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--red)" }} />
          </label>
        </div>
        {bargainOk && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>Max discount you allow</span>
              <span className="tnum" style={{ fontWeight: 800, color: "var(--red)" }}>{bargainPct}%</span>
            </div>
            <input type="range" min={0} max={30} value={bargainPct} onChange={e => setBargainPct(parseInt(e.target.value))} style={{ width: "100%", accentColor: "var(--red)" }} />
            <p style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 4 }}>Buyers see only &quot;Make an offer&quot; — never your limit.</p>
          </>
        )}
      </div>

      <Button variant="primary" size="lg" full disabled={!canPublish} onClick={() => { toast("Product published! · प्रकाशित भयो"); nav("s-products"); }}>
        Publish · प्रकाशित गर्नुहोस्
      </Button>
      {!canPublish && (
        <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 8, textAlign: "center" }}>Complete all 3 steps to publish</p>
      )}
      </div>
    </div>
  );
}

/* ---------- 4.5 Inventory — swipe-to-sell ---------- */
export const SELLER_INVENTORY = [
  { id: "s1", name: "Green Cotton Kurta Suit", price: 1200, stock: 12, icon: "shirt", tint: "green" },
  { id: "s2", name: "Pashmina Shawl — Maroon", price: 2450, stock: 4,  icon: "shirt", tint: "red" },
  { id: "s3", name: "Brass Diyo (pair)",       price: 1350, stock: 28, icon: "home",  tint: "gold" },
  { id: "s4", name: "Dhaka Topi — Classic",    price: 850,  stock: 2,  icon: "shirt", tint: "blue" },
  { id: "s5", name: "Lokta Paper Journal",     price: 650,  stock: 0,  icon: "book",  tint: "gold" },
  { id: "s6",  name: "Allo Nettle Fibre Scarf",   price: 1200, stock: 9,  icon: "palette", tint: "green" },
  { id: "s7",  name: "Wild Mountain Honey 500g",  price: 720,  stock: 34, icon: "leaf",    tint: "gold" },
  { id: "s8",  name: "Hemp Crossbody Backpack",   price: 1650, stock: 6,  icon: "tag",     tint: "green" },
  { id: "s9",  name: "Thanka Painting — Mandala", price: 5500, stock: 3,  icon: "palette", tint: "purple" },
  { id: "s10", name: "Yak Cheese Wheel 250g",     price: 980,  stock: 0,  icon: "leaf",    tint: "saffron" },
  { id: "s11", name: "Polarised Sunglasses",      price: 1450, stock: 18, icon: "tag",     tint: "slate" },
  { id: "s12", name: "Everyday Canvas Sneakers",  price: 2100, stock: 11, icon: "tag",     tint: "blue" },
  { id: "s13", name: "Himalayan Herbal Soap (4)", price: 540,  stock: 47, icon: "sparkles",tint: "green" },
  { id: "s14", name: "Ceramic Planter — Glazed",  price: 920,  stock: 2,  icon: "home",    tint: "teal" },
  { id: "s15", name: "Felt Wool Slippers",        price: 690,  stock: 23, icon: "shirt",   tint: "red" },
  { id: "s16", name: "Tibetan Singing Bowl",      price: 2900, stock: 1,  icon: "bowl",    tint: "gold" },
];

export const INV_SORTS = [
  { value: "added",    label: "Recently added" },
  { value: "stockLow", label: "Stock low → high" },
  { value: "priceLow", label: "Price low → high" },
  { value: "name",     label: "Name A → Z" },
];

export function SellerInventory() {
  const { nav, toast } = useBz();
  const [items, setItems] = useState(SELLER_INVENTORY);
  const [expanded, setExpanded] = useState(null);
  const [status, setStatus] = useState("all"); // all | active | low | oos
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("added");
  const [showImport, setShowImport] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]); // ids picked for bulk edit
  const [bulkPct, setBulkPct] = useState("");    // bulk discount %
  const [bulkStock, setBulkStock] = useState(""); // bulk set-stock

  const dec = (id) => setItems(list => list.map(it => it.id === id ? { ...it, stock: Math.max(0, it.stock - 1) } : it));
  const inc = (id) => setItems(list => list.map(it => it.id === id ? { ...it, stock: it.stock + 1 } : it));
  const sellInShop = (id) => { dec(id); toast("Sold one in shop · −1 stock"); };

  // Bulk-edit helpers
  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const exitSelect = () => { setSelectMode(false); setSelected([]); setBulkPct(""); setBulkStock(""); };
  const applyDiscount = () => {
    const pct = Math.min(90, Math.max(0, parseInt(bulkPct) || 0));
    if (!pct || !selected.length) return;
    setItems(list => list.map(it => selected.includes(it.id) ? { ...it, price: Math.round(it.price * (100 - pct) / 100) } : it));
    toast(`${pct}% off applied to ${selected.length} product${selected.length === 1 ? "" : "s"}`);
    exitSelect();
  };
  const applyStock = () => {
    const n = Math.max(0, parseInt(bulkStock) || 0);
    if (bulkStock === "" || !selected.length) return;
    setItems(list => list.map(it => selected.includes(it.id) ? { ...it, stock: n } : it));
    toast(`Stock set to ${n} for ${selected.length} product${selected.length === 1 ? "" : "s"}`);
    exitSelect();
  };
  const bulkDelete = () => {
    if (!selected.length) return;
    setItems(list => list.filter(it => !selected.includes(it.id)));
    toast(`${selected.length} product${selected.length === 1 ? "" : "s"} removed`);
    exitSelect();
  };

  const bucket = (it) => it.stock === 0 ? "oos" : it.stock <= 3 ? "low" : "active";
  const counts = {
    all:    items.length,
    active: items.filter(it => bucket(it) === "active").length,
    low:    items.filter(it => bucket(it) === "low").length,
    oos:    items.filter(it => bucket(it) === "oos").length,
  };
  const statusTabs = [
    { id: "all",    label: "All",          tone: "ink" },
    { id: "active", label: "Active",       tone: "success" },
    { id: "low",    label: "Low stock",    tone: "saffron" },
    { id: "oos",    label: "Out of stock", tone: "danger"  },
  ];

  let visible = items.filter(it => status === "all" || bucket(it) === status);
  if (search.trim()) {
    const q = search.toLowerCase();
    visible = visible.filter(it => it.name.toLowerCase().includes(q));
  }
  if (sort === "stockLow") visible = [...visible].sort((a, b) => a.stock - b.stock);
  else if (sort === "priceLow") visible = [...visible].sort((a, b) => a.price - b.price);
  else if (sort === "name") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));

  const filtersActive = status !== "all" || search.trim() || sort !== "added";
  const clearFilters = () => { setStatus("all"); setSearch(""); setSort("added"); };
  const invPaged = usePages(visible, 8, `${status}|${search}|${sort}`);

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          My products <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· मेरो सामान</span>
        </h1>
        <Button variant="primary" icon="plus" onClick={() => nav("s-add")}>Add</Button>
      </div>

      <div style={{ background: "var(--tint-blue-50)", padding: 12, borderRadius: "var(--r-md)", fontSize: ".8125rem", color: "var(--blue-deep)", marginBottom: 14, display: "flex", gap: 10 }}>
        <Icon name="badgeCheck" size={18} color="var(--blue)" />
        <span>Tap any item to change stock or edit. Items running low are marked orange.</span>
      </div>

      {/* Bulk tools: import / export / select many */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" icon="filePlus" onClick={() => setShowImport(true)}>
          Import from file · फाइलबाट थप्नुहोस्
        </Button>
        <Button variant="secondary" size="sm" icon="download" onClick={() => toast(`${items.length} products exported to a file`)}>
          Export
        </Button>
        {selectMode ? (
          <Button variant="ghost" size="sm" onClick={exitSelect}>Done selecting</Button>
        ) : (
          <Button variant="secondary" size="sm" icon="edit" onClick={() => setSelectMode(true)}>
            Edit many at once
          </Button>
        )}
      </div>

      {/* Status chips with counts */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        {statusTabs.map(t => {
          const active = status === t.id;
          const tone = t.tone === "ink" ? "var(--ink-900)" :
                       t.tone === "success" ? "var(--success)" :
                       t.tone === "saffron" ? "var(--saffron)" : "var(--danger)";
          return (
            <button key={t.id} onClick={() => setStatus(t.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", minHeight: 40,
                background: active ? tone : "#fff", color: active ? "#fff" : "var(--ink-700)",
                border: `1.5px solid ${active ? tone : "var(--line-200)"}`, borderRadius: 999,
                cursor: "pointer", fontWeight: 700, fontSize: ".8125rem", whiteSpace: "nowrap" }}>
              {t.label}
              <span className="tnum" style={{ background: active ? "rgba(255,255,255,.2)" : "var(--line-100)", padding: "1px 8px", borderRadius: 999, fontSize: ".7rem", fontWeight: 800 }}>{counts[t.id]}</span>
            </button>
          );
        })}
      </div>

      {/* Search + sort row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", position: "relative", minWidth: 200 }}>
          <Icon name="search" size={16} color="var(--ink-400)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name"
            style={{ width: "100%", padding: "10px 12px 10px 36px", height: 40, border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontSize: ".875rem", background: "#fff", color: "var(--ink-900)", outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "var(--r-full)", border: "none", background: "var(--line-200)", color: "var(--ink-700)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="x" size={12} color="var(--ink-700)" />
            </button>
          )}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ height: 40, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontSize: ".8125rem", background: "#fff", color: "var(--ink-700)", fontWeight: 700, cursor: "pointer" }}>
          {INV_SORTS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
        </select>
        {filtersActive && (
          <button onClick={clearFilters}
            style={{ height: 40, padding: "0 14px", border: "none", background: "none", color: "var(--ink-500)", fontWeight: 700, fontSize: ".8125rem", cursor: "pointer", textDecoration: "underline" }}>
            Clear filters
          </button>
        )}
      </div>

      <div className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginBottom: 12, fontWeight: 700 }}>
        {visible.length} of {items.length} product{items.length === 1 ? "" : "s"}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", border: "1.5px dashed var(--line-200)", borderRadius: "var(--r-lg)" }}>
          <Icon name="package" size={40} color="var(--ink-300)" />
          <div style={{ marginTop: 10, fontWeight: 800, color: "var(--ink-900)" }}>No products match</div>
          <div style={{ color: "var(--ink-500)", fontSize: ".8125rem", margin: "4px 0 14px" }}>Try clearing search or status filter.</div>
          <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
        </div>
      ) : (
      <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {invPaged.visible.map(it => {
          const low = it.stock <= 3 && it.stock > 0;
          const oos = it.stock === 0;
          const isOpen = expanded === it.id;
          const picked = selected.includes(it.id);
          return (
            <div key={it.id} style={{
              background: oos ? "var(--line-100)" : low ? "rgba(247,127,0,.08)" : "#fff",
              border: `1.5px solid ${picked ? "var(--blue)" : low ? "var(--saffron)" : "var(--line-200)"}`,
              borderRadius: "var(--r-lg)", overflow: "hidden",
            }}>
              <button onClick={() => selectMode ? toggleSelect(it.id) : setExpanded(isOpen ? null : it.id)}
                style={{ width: "100%", display: "flex", gap: 14, alignItems: "center", padding: 14, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                {selectMode && (
                  <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: "var(--r-sm)", border: `2px solid ${picked ? "var(--blue)" : "var(--line-200)"}`, background: picked ? "var(--blue)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {picked && <Icon name="check" size={15} color="#fff" />}
                  </span>
                )}
                <Placeholder icon={it.icon} tint={it.tint} style={{ width: 72, height: 72 }} radius="var(--r-md)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{it.name}</div>
                  <div className="tnum" style={{ fontSize: ".875rem", color: "var(--blue-deep)", fontWeight: 800, marginTop: 2 }}>Rs. {it.price.toLocaleString()}</div>
                  <div style={{ fontSize: ".8125rem", color: oos ? "var(--danger)" : low ? "var(--saffron)" : "var(--ink-500)", marginTop: 2, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {oos ? <><Icon name="zap" size={14} color="var(--danger)" /> Out of stock · सकियो</> :
                     low  ? <><Icon name="zap" size={14} color="var(--saffron)" /> Only {it.stock} left · कम छ</> :
                            <>Stock: {it.stock}</>}
                  </div>
                </div>
                {!selectMode && <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={22} color="var(--ink-400)" />}
              </button>

              {isOpen && !selectMode && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px dashed var(--line-200)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
                    <div style={{ fontWeight: 700, fontSize: ".875rem" }}>Change stock · संख्या परिवर्तन</div>
                    <div style={{ display: "inline-flex", alignItems: "center", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", overflow: "hidden", background: "#fff" }}>
                      <button onClick={(e) => { e.stopPropagation(); dec(it.id); }} disabled={it.stock === 0} style={{ width: 44, height: 48, background: "#fff", border: "none", cursor: "pointer", color: "var(--ink-700)" }}><Icon name="minus" size={18} /></button>
                      <span className="tnum" style={{ width: 48, textAlign: "center", fontWeight: 800, fontSize: "1.125rem" }}>{it.stock}</span>
                      <button onClick={(e) => { e.stopPropagation(); inc(it.id); }} style={{ width: 44, height: 48, background: "#fff", border: "none", cursor: "pointer", color: "var(--ink-700)" }}><Icon name="plus" size={18} /></button>
                    </div>
                  </div>
                  {!oos && (
                    <Button variant="secondary" full onClick={() => sellInShop(it.id)} icon="store">
                      Sold one in my shop · पसलमा बेचेँ (−1)
                    </Button>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Button variant="ghost" full icon="image">Edit photo</Button>
                    <Button variant="ghost" full>Edit price</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 16 }}>
        <PageBar page={invPaged.page} pageCount={invPaged.pageCount} onPage={invPaged.goPage} alwaysShow />
        <div className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}>
          Showing {invPaged.from}–{invPaged.to} of {invPaged.total} products
        </div>
      </div>
      </>
      )}

      {/* Sticky bulk-edit action bar */}
      {selectMode && selected.length > 0 && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 120, background: "#fff", borderTop: "1px solid var(--line-200)", boxShadow: "0 -2px 14px rgba(15,23,42,.1)", padding: "12px 16px calc(12px + env(safe-area-inset-bottom))" }}>
          <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
            <div style={{ fontWeight: 800, fontSize: ".9375rem", color: "var(--blue-deep)", marginBottom: 10 }}>
              {selected.length} selected · {selected.length === items.length ? "all" : "छानिएको"}
              <button onClick={() => setSelected(selected.length === visible.length ? [] : visible.map(it => it.id))}
                style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, fontSize: ".8125rem", cursor: "pointer", marginLeft: 10 }}>
                {selected.length === visible.length ? "Clear" : "Select all shown"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--ink-500)", display: "block", marginBottom: 4 }}>Give discount %</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={bulkPct} onChange={e => setBulkPct(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="10"
                    className="tnum" style={{ width: 64, height: 40, textAlign: "center", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", fontWeight: 800, outline: "none" }} />
                  <Button variant="secondary" size="sm" onClick={applyDiscount}>Apply</Button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--ink-500)", display: "block", marginBottom: 4 }}>Set stock to</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={bulkStock} onChange={e => setBulkStock(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="0"
                    className="tnum" style={{ width: 64, height: 40, textAlign: "center", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", fontWeight: 800, outline: "none" }} />
                  <Button variant="secondary" size="sm" onClick={applyStock}>Apply</Button>
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <label style={{ fontSize: ".75rem", fontWeight: 700, color: "transparent", display: "block", marginBottom: 4 }}>.</label>
                <Button variant="danger" size="sm" icon="trash" onClick={bulkDelete}>Remove</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import-from-file modal (prototype) */}
      {showImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
             onClick={() => setShowImport(false)}>
          <div style={{ background: "#fff", borderRadius: "var(--r-xl)", maxWidth: 460, width: "100%", padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}>Add many products from a file</h3>
              <button onClick={() => setShowImport(false)} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "var(--r-md)", border: "1.5px solid var(--line-200)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="ne" style={{ color: "var(--ink-500)", margin: "0 0 14px", fontSize: ".875rem" }}>एकैपटक धेरै सामान थप्नुहोस्</p>

            <button onClick={() => { toast("16 products read from your file · जाँच गर्नुहोस्"); setShowImport(false); }}
              style={{ width: "100%", padding: 28, background: "var(--tint-blue-50)", border: "1.5px dashed var(--blue)", borderRadius: "var(--r-md)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="filePlus" size={32} color="var(--blue)" />
              <span style={{ fontWeight: 800, color: "var(--blue)" }}>Choose a CSV or Excel file</span>
              <span style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>Tap to pick from your phone</span>
            </button>

            <div style={{ background: "var(--line-100)", borderRadius: "var(--r-md)", padding: 14, fontSize: ".8125rem", color: "var(--ink-700)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Your file needs these columns:</div>
              <div className="tnum" style={{ color: "var(--ink-500)" }}>Name · Category · Price · Stock · Description</div>
            </div>
            <Button variant="ghost" size="sm" icon="download" full style={{ marginTop: 10 }}
              onClick={() => toast("Sample file downloaded")}>
              Download a sample file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 4.6 Payouts Ledger ---------- */
export function SellerLedger() {
  const { nav } = useBz();
  const rows = [
    { date: "May 28", cash: 24500, fee: 500, net: 24000, status: "received" },
    { date: "May 27", cash: 18200, fee: 380, net: 17820, status: "received" },
    { date: "May 26", cash: 21800, fee: 440, net: 21360, status: "received" },
    { date: "May 25", cash: 9600,  fee: 200, net: 9400,  status: "sending" },
    { date: "May 24", cash: 14200, fee: 300, net: 13900, status: "held" },
  ];
  const statusLabel = {
    received: { en: "Received", ne: "पैसा आयो ✓", color: "var(--success)", bg: "rgba(22,163,74,.1)" },
    sending:  { en: "Sending",  ne: "पठाउँदै",     color: "var(--saffron)", bg: "rgba(247,127,0,.1)" },
    held:     { en: "On hold",  ne: "रोकिएको",    color: "var(--danger)",  bg: "rgba(220,38,38,.1)" },
  };

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Payouts <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· भुक्तानी</span>
        </h1>
        <Button variant="ghost" onClick={() => nav("s-dashboard")} icon="chevronLeft">Back</Button>
      </div>

      {/* When will I get my money? explainer */}
      <div style={{ background: "linear-gradient(135deg, var(--tint-blue-50) 0%, rgba(22,163,74,.06) 100%)", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Icon name="wallet" size={22} color="var(--blue-deep)" />
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>When do I get my money?</h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".875rem", color: "var(--ink-700)", lineHeight: 1.7 }}>
          <li><b>eSewa / Khalti orders:</b> Money lands within 24 hours of delivery.</li>
          <li><b>Cash on Delivery:</b> Money lands 2 days after rider returns cash.</li>
          <li><b>On hold:</b> Buyer raised a return — money is paused until resolved.</li>
        </ul>
      </div>

      <div style={{ marginBottom: 14 }}>
        <ChipGroup options={[{value:"week", label:"This week"}, {value:"month", label:"This month"}, {value:"all", label:"All time"}]} value="week" onChange={() => {}} />
      </div>

      <div style={{ background: "#fff", border: "2px solid var(--ink-900)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ background: "var(--ink-900)", color: "#fff", padding: "10px 16px", fontWeight: 800, fontSize: ".8125rem", letterSpacing: ".06em", textTransform: "uppercase", textAlign: "center" }}>
          Payout history · भुक्तानी इतिहास
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--line-100)" }}>
              {["Date", "Sold", "Fee", "Net", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: ".75rem", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-700)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const s = statusLabel[r.status];
              return (
                <tr key={i} style={{ borderTop: "1.5px solid var(--line-200)" }}>
                  <td style={{ padding: "14px 12px", fontWeight: 700 }}>{r.date}</td>
                  <td className="tnum" style={{ padding: "14px 12px" }}>Rs. {r.cash.toLocaleString()}</td>
                  <td className="tnum" style={{ padding: "14px 12px", color: "var(--danger)" }}>− Rs. {r.fee.toLocaleString()}</td>
                  <td className="tnum" style={{ padding: "14px 12px", color: "var(--success)", fontWeight: 800 }}>Rs. {r.net.toLocaleString()}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, background: s.bg, color: s.color, fontWeight: 700, fontSize: ".75rem" }}>
                      <span className="ne">{s.ne}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <Button variant="ghost" full icon="image">Save as PDF</Button>
        <Button variant="ghost" full icon="phone">Talk to support</Button>
      </div>
    </div>
  );
}

/* ---------- 4.7 Customer Chat ---------- */
export const CHAT_QUICK_REPLIES = [
  { en: "Yes, in stock.",                  ne: "हो, छ।" },
  { en: "Will ship today.",                ne: "आज पठाउँछौँ।" },
  { en: "Lowest price already.",           ne: "अहिले नै सबभन्दा कम।" },
  { en: "Delivery in 2-3 days.",           ne: "२-३ दिनमा पुग्छ।" },
  { en: "Sorry, out of stock.",            ne: "माफ गर्नुहोस्, सकियो।" },
  { en: "Bargain accepted.",               ne: "मोलतोल स्वीकार।" },
];

export const CHAT_THREADS = [
  { id: "c1", buyer: "Sarita Thapa",  city: "Lalitpur",  last: "Is size XL still available?",                 unread: 2, time: "2m",  avatar: "S", tone: "green" },
  { id: "c2", buyer: "Anjali Gurung", city: "Pokhara",   last: "Can you ship to Pokhara?",                    unread: 1, time: "14m", avatar: "A", tone: "blue" },
  { id: "c3", buyer: "Bikash Rai",    city: "Biratnagar",last: "Thank you, received the diyo today",          unread: 0, time: "1h",  avatar: "B", tone: "gold" },
  { id: "c4", buyer: "Kabita Magar",  city: "Butwal",    last: "I want 2 cushions, any discount?",            unread: 0, time: "3h",  avatar: "K", tone: "red" },
];

export function SellerChat() {
  const { toast } = useBz();
  const [active, setActive] = useState(CHAT_THREADS[0]);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState({
    c1: [
      { from: "buyer", text: "Hi! Is the green kurta size XL still available?", t: "10:42" },
      { from: "buyer", text: "Is size XL still available?", t: "10:45" },
    ],
    c2: [{ from: "buyer", text: "Can you ship to Pokhara?", t: "09:30" }],
    c3: [{ from: "buyer", text: "Thank you, received the diyo today", t: "yesterday" }],
    c4: [{ from: "buyer", text: "I want 2 cushions, any discount?", t: "yesterday" }],
  });

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(m => ({ ...m, [active.id]: [...(m[active.id] || []), { from: "me", text, t: "now" }] }));
    setMsg("");
  };

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Chat <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· च्याट</span>
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>Reply fast. Buyers who wait &gt; 1hr usually leave.</p>
        </div>
        <Button variant="secondary" icon="edit" size="sm" onClick={() => toast("Edit quick replies — coming soon")}>Edit quick replies</Button>
      </div>

      <div className="bz-chat-shell">
        {/* Threads list */}
        <aside style={{ borderRight: "1px solid var(--line-200)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {CHAT_THREADS.map(t => {
            const sel = active.id === t.id;
            return (
              <button key={t.id} onClick={() => setActive(t)}
                style={{ display: "flex", gap: 10, padding: 12, background: sel ? "var(--tint-blue-50)" : "#fff", border: "none", borderBottom: "1px solid var(--line-200)", cursor: "pointer", textAlign: "left", width: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: TINTS[t.tone][0], color: TINTS[t.tone][2], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{t.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: ".875rem", color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.buyer}</div>
                    <div style={{ fontSize: ".7rem", color: "var(--ink-400)" }}>{t.time}</div>
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.last}</div>
                </div>
                {t.unread > 0 && <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--danger)", color: "#fff", fontSize: ".68rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.unread}</span>}
              </button>
            );
          })}
        </aside>

        {/* Conversation */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-200)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: TINTS[active.tone][0], color: TINTS[active.tone][2], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{active.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: ".9375rem" }}>{active.buyer}</div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{active.city} · usually replies in 1h</div>
            </div>
            <a href="tel:98XXXXXXXX" style={{ width: 38, height: 38, borderRadius: "50%", background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Icon name="phone" size={18} color="#fff" />
            </a>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#f7f8fb", display: "flex", flexDirection: "column", gap: 8 }}>
            {(messages[active.id] || []).map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                <div style={{ padding: "10px 14px", background: m.from === "me" ? "var(--blue)" : "#fff", color: m.from === "me" ? "#fff" : "var(--ink-900)", borderRadius: m.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: ".875rem", border: m.from === "me" ? "none" : "1px solid var(--line-200)" }}>
                  {m.text}
                </div>
                <div style={{ fontSize: ".65rem", color: "var(--ink-400)", marginTop: 2, textAlign: m.from === "me" ? "right" : "left" }}>{m.t}</div>
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--line-200)", display: "flex", gap: 6, overflowX: "auto", background: "#fff" }}>
            {CHAT_QUICK_REPLIES.map(q => (
              <button key={q.en} onClick={() => send(q.en)}
                style={{ flexShrink: 0, padding: "6px 12px", background: "var(--tint-blue-50)", border: "1px solid var(--blue)", color: "var(--blue)", borderRadius: 999, fontSize: ".75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {q.en}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: 10, borderTop: "1px solid var(--line-200)", display: "flex", gap: 8, background: "#fff" }}>
            <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send(msg)}
              placeholder="Type a message · सन्देश लेख्नुहोस्"
              style={{ flex: 1, height: 44, padding: "0 14px", border: "1.5px solid var(--line-200)", borderRadius: 999, fontSize: ".9375rem", outline: "none", fontFamily: "var(--font-sans)" }} />
            <button onClick={() => send(msg)} disabled={!msg.trim()}
              style={{ width: 44, height: 44, borderRadius: "50%", background: msg.trim() ? "var(--red)" : "var(--line-200)", color: "#fff", border: "none", cursor: msg.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="arrowRight" size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 4.8 Bargaining ---------- */
export const BARGAIN_OFFERS = [
  { id: "b1", buyer: "Anjali Gurung",  city: "Pokhara",   product: "Pashmina Shawl — Maroon", listed: 2450, offered: 2100, discount: 14, time: "12 min ago",   icon: "shirt", tint: "red"   },
  { id: "b2", buyer: "Sarita Thapa",   city: "Lalitpur",  product: "Green Cotton Kurta",       listed: 1200, offered: 1050, discount: 13, time: "Accepted 1h", icon: "shirt", tint: "green", accepted: true },
  { id: "b3", buyer: "Bikash Rai",     city: "Biratnagar",product: "Brass Diyo (pair)",        listed: 1350, offered: 1100, discount: 19, time: "Rejected 3h", icon: "home",  tint: "gold",  rejected: true },
];

export function SellerBargain() {
  const { toast } = useBz();
  const [maxPct, setMaxPct] = useState(12);
  const [enabled, setEnabled] = useState(true);

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        Bargaining <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· मोलतोल</span>
      </h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
        Buyers can send you offers below your listed price. You decide the maximum discount. Buyers can&apos;t see this limit.
      </p>

      {/* Max bargain setter */}
      <div style={{ background: "linear-gradient(135deg, #0a2e6b 0%, #1e3a8a 100%)", borderRadius: "var(--r-lg)", padding: 22, color: "#fff", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: ".8125rem", opacity: .85 }}>Maximum bargain you allow</div>
            <div className="ne" style={{ fontSize: ".75rem", opacity: .7 }}>तपाईंले दिने अधिकतम छुट</div>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: ".8125rem", fontWeight: 700 }}>Accept offers</span>
          </label>
        </div>
        <div className="tnum bz-stat-xl" style={{ fontWeight: 800, lineHeight: 1, margin: "8px 0 12px" }}>{maxPct}%</div>
        <input type="range" min={0} max={30} value={maxPct} onChange={e => setMaxPct(parseInt(e.target.value))} disabled={!enabled}
          style={{ width: "100%", accentColor: "var(--red)", opacity: enabled ? 1 : .5 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".7rem", opacity: .7, marginTop: 4 }}>
          <span>0% (fixed price)</span><span>15%</span><span>30%</span>
        </div>
        <div style={{ marginTop: 14, padding: 10, background: "rgba(255,255,255,.1)", borderRadius: "var(--r-md)", fontSize: ".8125rem" }}>
          <Icon name="shieldCheck" size={14} color="#fff" style={{ verticalAlign: "middle", marginRight: 6 }} />
          Buyers see only "Make an offer" — never your limit. Offers above {maxPct}% are auto-rejected.
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { v: "12",   k: "Offers this week",   c: "var(--blue)" },
          { v: "67%",  k: "You accepted",       c: "var(--success)" },
          { v: "8%",   k: "Average discount",   c: "var(--saffron)" },
          { v: "Rs. 1,840", k: "Margin given",  c: "var(--danger)" },
        ].map(s => (
          <div key={s.k} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 14 }}>
            <div className="tnum" style={{ fontSize: "1.375rem", fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* Offers */}
      <h2 style={{ margin: "0 0 10px", fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}>Offers · प्रस्ताव</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BARGAIN_OFFERS.map(o => {
          const status = o.accepted ? "accepted" : o.rejected ? "rejected" : "pending";
          return (
            <div key={o.id} style={{ background: "#fff", border: `1.5px solid ${status === "pending" ? "var(--red)" : "var(--line-200)"}`, borderRadius: "var(--r-lg)", padding: 14, display: "flex", gap: 12 }}>
              <Placeholder icon={o.icon} tint={o.tint} style={{ width: 56, height: 56, flexShrink: 0 }} radius="var(--r-md)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {status === "pending"  && <Chip tone="red" size="sm" icon="bargain">New offer</Chip>}
                  {status === "accepted" && <Chip tone="success" size="sm" icon="check">Accepted</Chip>}
                  {status === "rejected" && <Chip tone="danger" size="sm" icon="x">Rejected</Chip>}
                  <span style={{ fontSize: ".7rem", color: "var(--ink-400)", marginLeft: "auto" }}>{o.time}</span>
                </div>
                <div style={{ fontWeight: 800 }}>{o.buyer} · {o.city}</div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-700)", marginTop: 2 }}>{o.product}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: ".875rem", flexWrap: "wrap" }}>
                  <span>Listed: <span className="tnum" style={{ textDecoration: "line-through", color: "var(--ink-500)" }}>Rs. {o.listed.toLocaleString()}</span></span>
                  <span>Offer: <span className="tnum" style={{ fontWeight: 800, color: "var(--blue-deep)" }}>Rs. {o.offered.toLocaleString()}</span></span>
                  <span style={{ color: o.discount > maxPct ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>−{o.discount}%</span>
                </div>
                {status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Button variant="primary" size="sm" onClick={() => toast("Offer accepted")}>Accept</Button>
                    <Button variant="secondary" size="sm" onClick={() => toast("Counter offer sent")}>Counter</Button>
                    <Button variant="danger" size="sm" onClick={() => toast("Offer rejected")}>Reject</Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 4.9 Promotions ---------- */
export function SellerPromotions() {
  const { toast } = useBz();
  const [activeTab, setActiveTab] = useState("active");
  const promoTypes = [
    { id: "flash",   icon: "zap",      en: "Flash sale",        ne: "फ्ल्यास सेल",     desc: "Time-limited % off on selected items" },
    { id: "percent", icon: "percent",  en: "Percent discount",  ne: "प्रतिशत छुट",     desc: "Plain % off, no countdown" },
    { id: "bogo",    icon: "gift",     en: "Buy 1 Get 1",       ne: "१ किने १ फ्री",   desc: "Pair products as BOGO deals" },
    { id: "coupon",  icon: "ticket",   en: "Coupon code",       ne: "कुपन कोड",        desc: "Codes buyers type at checkout" },
  ];
  const active = [
    { type: "Flash sale", name: "Friday 5pm — Pashmina 20% off", ends: "in 3 days", uses: 12, max: 50, color: "var(--saffron)" },
    { type: "Coupon",     name: "NEWBUYER100 — Rs. 100 off",      ends: "30 days",  uses: 38, max: 200, color: "var(--blue)" },
  ];

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Promotions <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· छुट</span></h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>Move slow stock. Reward repeat buyers. Get a sales bump for a few days.</p>

      <h2 style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 800 }}>Start a new promotion</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {promoTypes.map(p => (
          <button key={p.id} onClick={() => toast(`${p.en} wizard — coming soon`)}
            style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16, cursor: "pointer", textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--tint-red-50)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={p.icon} size={22} color="var(--red)" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{p.en}</div>
              <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{p.ne}</div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-700)", marginTop: 6 }}>{p.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { id: "active", label: `Active (${active.length})` },
          { id: "scheduled", label: "Scheduled (0)" },
          { id: "ended",  label: "Ended (4)" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "8px 14px", background: activeTab === t.id ? "var(--ink-900)" : "#fff", color: activeTab === t.id ? "#fff" : "var(--ink-700)", border: `1.5px solid ${activeTab === t.id ? "var(--ink-900)" : "var(--line-200)"}`, borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: ".8125rem" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {active.map(p => (
          <div key={p.name} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 6, height: 60, background: p.color, borderRadius: 3 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".7rem", color: "var(--ink-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{p.type}</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{p.name}</div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>Ends {p.ends} · <span className="tnum">{p.uses}/{p.max}</span> uses</div>
            </div>
            <Button variant="ghost" size="sm" icon="edit">Edit</Button>
            <Button variant="danger" size="sm" icon="trash">Stop</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4.10 Reviews ---------- */
export const REVIEWS_DATA = [
  { id: "r1", buyer: "Anjali G.",  stars: 5, product: "Brass Diyo (pair)",      text: "Beautiful work. Lighter than expected but elegant. Delivered fast.", time: "2 days ago", replied: true,  reply: "Thank you Anjali! Glad you liked it." },
  { id: "r2", buyer: "Sarita T.",  stars: 4, product: "Green Cotton Kurta",     text: "Good quality cotton. Color slightly darker than photo.",              time: "5 days ago", replied: false },
  { id: "r3", buyer: "Bikash R.",  stars: 2, product: "Dhaka Topi — Classic",   text: "Stitching loose on one side.",                                          time: "1 week ago", replied: false, low: true },
  { id: "r4", buyer: "Kabita M.",  stars: 5, product: "Pashmina Shawl",         text: "Soft, warm, perfect for winter. Will buy again.",                      time: "1 week ago", replied: true,  reply: "धन्यवाद! आगामी सिजनमा नयाँ रङ ल्याउँदैछौँ।" },
];

export function SellerReviews() {
  const { toast } = useBz();
  const [filter, setFilter] = useState("all");
  const list = REVIEWS_DATA.filter(r => filter === "all" || (filter === "unreplied" && !r.replied) || (filter === "low" && r.stars <= 3));
  const avg = (REVIEWS_DATA.reduce((s, r) => s + r.stars, 0) / REVIEWS_DATA.length).toFixed(1);

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Reviews <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· समीक्षा</span></h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>Reply to every review. Buyers trust shops that listen.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { v: `${avg} ★`, k: "Average", c: "var(--gold)" },
          { v: REVIEWS_DATA.length,                           k: "Total",         c: "var(--blue)" },
          { v: REVIEWS_DATA.filter(r => !r.replied).length,   k: "Needs reply",   c: "var(--red)" },
          { v: REVIEWS_DATA.filter(r => r.stars <= 3).length, k: "Low ratings",   c: "var(--danger)" },
        ].map(s => (
          <div key={s.k} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 14 }}>
            <div className="tnum" style={{ fontSize: "1.375rem", fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{s.k}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[
          { id: "all", label: "All" },
          { id: "unreplied", label: "Needs reply" },
          { id: "low", label: "Low (≤ 3★)" },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            style={{ padding: "8px 14px", background: filter === t.id ? "var(--ink-900)" : "#fff", color: filter === t.id ? "#fff" : "var(--ink-700)", border: `1.5px solid ${filter === t.id ? "var(--ink-900)" : "var(--line-200)"}`, borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: ".8125rem", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map(r => (
          <div key={r.id} style={{ background: "#fff", border: `1.5px solid ${r.low ? "var(--danger)" : "var(--line-200)"}`, borderRadius: "var(--r-lg)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--tint-blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{r.buyer[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{r.buyer}</div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{r.product} · {r.time}</div>
              </div>
              <RatingStars value={r.stars} />
            </div>
            <p style={{ margin: "8px 0", color: "var(--ink-700)", fontSize: ".9375rem" }}>{r.text}</p>
            {r.replied ? (
              <div style={{ marginTop: 8, padding: 10, background: "var(--line-100)", borderRadius: "var(--r-md)", borderLeft: "3px solid var(--blue)" }}>
                <div style={{ fontSize: ".7rem", color: "var(--blue)", fontWeight: 800, marginBottom: 2 }}>Your reply</div>
                <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>{r.reply}</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Button variant="primary" size="sm" onClick={() => toast("Reply sent")}>Reply</Button>
                <Button variant="ghost" size="sm" icon="flag" onClick={() => toast("Reported to BazaarCo")}>Report</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4.11 Storefront builder ---------- */
export function SellerStorefront() {
  const { toast } = useBz();
  const [viewMobile, setViewMobile] = useState(true);
  const [blocks, setBlocks] = useState([
    { id: "hero",       en: "Hero banner",         enabled: true },
    { id: "featured",   en: "Featured products",   enabled: true },
    { id: "video",      en: "Video reel",          enabled: true },
    { id: "about",      en: "About us",            enabled: true },
    { id: "categories", en: "Category grid",       enabled: false },
  ]);

  const move = (idx, dir) => {
    const arr = [...blocks];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    setBlocks(arr);
  };

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Storefront <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· पसल सजावट</span></h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>Customize how buyers see your shop. Changes go live in 5 minutes.</p>

      <div className="bz-seller-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {/* Editor */}
        <div>
          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>Shop logo &amp; banner</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <Placeholder icon="store" tint="red" style={{ width: 64, height: 64 }} radius="50%" />
              <Button variant="secondary" size="sm" icon="image" onClick={() => toast("Upload logo")}>Change logo</Button>
            </div>
            <Placeholder icon="image" tint="blue" style={{ width: "100%", height: 100 }} radius="var(--r-md)" />
            <Button variant="secondary" size="sm" icon="image" onClick={() => toast("Upload banner")} style={{ marginTop: 8 }}>Change banner</Button>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>About us</h3>
            <textarea placeholder="Tell buyers your story. e.g. Family-run handicraft shop in Bhaktapur since 2018..."
              style={{ width: "100%", minHeight: 80, padding: 12, border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", fontSize: ".875rem", outline: "none", resize: "vertical" }} />
          </div>

          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>Section order</h3>
            {blocks.map((b, i) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < blocks.length - 1 ? "1px dashed var(--line-200)" : "none" }}>
                <input type="checkbox" checked={b.enabled} onChange={() => setBlocks(arr => arr.map(x => x.id === b.id ? { ...x, enabled: !x.enabled } : x))} style={{ width: 18, height: 18 }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{b.en}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", border: "1px solid var(--line-200)", background: "#fff", cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? .3 : 1 }}>↑</button>
                <button onClick={() => move(i, 1)}  disabled={i === blocks.length - 1} style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", border: "1px solid var(--line-200)", background: "#fff", cursor: i === blocks.length - 1 ? "default" : "pointer", opacity: i === blocks.length - 1 ? .3 : 1 }}>↓</button>
              </div>
            ))}
          </div>

          <Button variant="primary" size="lg" full onClick={() => toast("Storefront published — buyers see it in 5 min")} style={{ marginTop: 14 }}>Publish changes</Button>
        </div>

        {/* Preview */}
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[{ id: true, l: "Mobile" }, { id: false, l: "Desktop" }].map(o => (
              <button key={o.l} onClick={() => setViewMobile(o.id)}
                style={{ padding: "6px 12px", background: viewMobile === o.id ? "var(--ink-900)" : "#fff", color: viewMobile === o.id ? "#fff" : "var(--ink-700)", border: "1.5px solid var(--line-200)", borderRadius: 999, fontSize: ".75rem", fontWeight: 700, cursor: "pointer" }}>{o.l}</button>
            ))}
          </div>
          <div style={{ width: viewMobile ? 280 : "100%", margin: "0 auto", maxWidth: "100%", background: "#000", borderRadius: viewMobile ? 28 : 8, padding: viewMobile ? 10 : 6 }}>
            <div style={{ background: "#fff", borderRadius: viewMobile ? 20 : 6, overflow: "hidden" }}>
              <Placeholder icon="image" tint="blue" style={{ width: "100%", height: 120 }} radius="0" />
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Placeholder icon="store" tint="red" style={{ width: 44, height: 44 }} radius="50%" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: ".875rem" }}>Bhaktapur Handicraft</div>
                    <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>★ 4.8 · Verified</div>
                  </div>
                </div>
                {blocks.filter(b => b.enabled).map(b => (
                  <div key={b.id} style={{ marginTop: 12, padding: 12, background: "var(--line-100)", borderRadius: 8, fontSize: ".75rem", color: "var(--ink-500)" }}>
                    {b.en}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 4.12 Videos ---------- */
export const SELLER_VIDEOS = [
  { id: "v1", title: "Green Cotton Kurta — try-on",  views: 1240, likes: 87, product: "Green Cotton Kurta",    tint: "green", thumb: "https://picsum.photos/seed/seller-video-1/400/600" },
  { id: "v2", title: "Pashmina shawl unboxing",       views: 980,  likes: 64, product: "Pashmina Shawl",         tint: "red", thumb: "https://picsum.photos/seed/seller-video-2/400/600" },
  { id: "v3", title: "How to use brass diyo",         views: 720,  likes: 42, product: "Brass Diyo",            tint: "gold", thumb: "https://picsum.photos/seed/seller-video-3/400/600" },
];

export function SellerVideos() {
  const { toast } = useBz();
  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Videos <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· भिडियो</span></h1>
        <Button variant="primary" icon="plus" onClick={() => toast("Upload video — coming soon")}>Add video</Button>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>Products with video sell 2× more. Keep videos under 30 seconds.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {SELLER_VIDEOS.map(v => (
          <div key={v.id} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            <VideoPlayer tint={v.tint} icon="shirt" ratio="4/5" radius="0" thumb={v.thumb} />
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, fontSize: ".875rem" }}>{v.title}</div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>For: {v.product}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: ".75rem", color: "var(--ink-500)" }}>
                <span><Icon name="eye" size={14} style={{ verticalAlign: "middle", marginRight: 2 }} /> {v.views.toLocaleString()}</span>
                <span><Icon name="heart" size={14} style={{ verticalAlign: "middle", marginRight: 2 }} /> {v.likes}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <Button variant="ghost" size="sm" icon="edit" full>Edit</Button>
                <Button variant="ghost" size="sm" icon="trash" full>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4.13 Analytics + Reports merged ---------- */
export const REPORT_CARDS = [
  { icon: "refresh",      color: "var(--saffron)", title: "Restock now",            sub: "3 items below safety stock", count: 3, action: "View list", items: ["Dhaka Topi (2 left)", "Pashmina Maroon (4 left)", "Lokta Journal (0 left)"] },
  { icon: "trendingUp",   color: "var(--success)", title: "Hot this week",          sub: "Units up 50%+ vs last week", count: 2, action: "Boost with video", items: ["Brass Diyo +120%", "Tibetan Bowl +68%"] },
  { icon: "trendingDown", color: "var(--danger)",  title: "Slow movers",            sub: "No sale in 14 days",         count: 4, action: "Add discount", items: ["Wool Cap", "Pashmina Beige", "Singing Bowl Small", "Felt Slippers"] },
  { icon: "user",         color: "var(--blue)",    title: "Buyers who didn't return", sub: "Bought 30+ days ago",      count: 18, action: "Send coupon", items: [] },
];
export const REPORT_DOWNLOADS = [
  { en: "Tax report (PDF)",         ne: "कर रिपोर्ट" },
  { en: "Monthly sales (CSV)",      ne: "मासिक बिक्री" },
  { en: "Buyer list (CSV)",         ne: "खरिदकर्ता सूची" },
  { en: "Inventory snapshot (CSV)", ne: "मौजुदा सामान" },
];

/* Cash flow combo chart — daily gross bars + cleared cash line */
export function SellerCashFlowChart({ data, height = 200 }) {
  const max = Math.max(...data.flatMap(d => [d.gross, d.cleared]), 1);
  const W = 100, H = 100, n = data.length;
  const barW = (W - 8) / n - 2;
  const points = data.map((d, i) => {
    const x = 4 + i * ((W - 8) / n) + barW / 2 + 1;
    const y = 96 - (d.cleared / max) * 88;
    return `${x},${y}`;
  }).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="var(--line-200)" strokeWidth=".3" />
        ))}
        {data.map((d, i) => {
          const h = (d.gross / max) * 88;
          const x = 4 + i * ((W - 8) / n) + 1;
          const y = 96 - h;
          return <rect key={i} x={x} y={y} width={barW} height={h} fill="var(--blue)" opacity=".55" rx="1" />;
        })}
        <polyline points={points} fill="none" stroke="var(--success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = 4 + i * ((W - 8) / n) + barW / 2 + 1;
          const y = 96 - (d.cleared / max) * 88;
          return <circle key={i} cx={x} cy={y} r="1.2" fill="var(--success)" />;
        })}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, marginTop: 6, fontSize: ".7rem", color: "var(--ink-500)", textAlign: "center", fontWeight: 600 }}>
        {data.map((d, i) => <div key={i}>{d.label}</div>)}
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, fontSize: ".75rem", fontWeight: 700 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 10, background: "var(--blue)", opacity: .55, borderRadius: 2 }} />Total sold</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 2, background: "var(--success)", borderRadius: 2 }} />Cash in your bank</span>
      </div>
    </div>
  );
}

/* Horizontal velocity bars */
export function SellerVelocityBars({ rows, color }) {
  const max = Math.max(...rows.map(r => Math.abs(r.value)), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(r => {
        const pct = (Math.abs(r.value) / max) * 100;
        return (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8125rem", marginBottom: 4 }}>
              <span style={{ fontWeight: 700 }}>{r.label}</span>
              <span className="tnum" style={{ fontWeight: 800, color }}>{r.suffix ? `${r.value}${r.suffix}` : r.value}</span>
            </div>
            <div style={{ height: 10, background: "var(--line-100)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SellerAnalytics_legacy_unused() {
  const toast = () => {};
  const [tab, setTab] = useState("trends");
  const [range, setRange] = useState("week");
  const salesByDay = [
    { label: "Sat", value: 12500 }, { label: "Sun", value: 18200 }, { label: "Mon", value: 9600 },
    { label: "Tue", value: 21800 }, { label: "Wed", value: 14200 }, { label: "Thu", value: 18900 },
    { label: "Fri", value: 24500, highlight: true },
  ];
  const funnel = [
    { label: "Saw your product",   value: 4820, icon: "eye",     color: "var(--blue)" },
    { label: "Tapped to view",     value: 1420, icon: "image",   color: "var(--saffron)" },
    { label: "Added to cart",      value:  612, icon: "cart",    color: "var(--red)" },
    { label: "Bought",             value:  118, icon: "check",   color: "var(--success)" },
  ];
  const cohort = [
    { m: "Jan", new: 32, m1: 12, m2: 6, m3: 4 },
    { m: "Feb", new: 41, m1: 18, m2: 9, m3: null },
    { m: "Mar", new: 58, m1: 22, m2: null, m3: null },
    { m: "Apr", new: 64, m1: null, m2: null, m3: null },
  ];

  // Cash flow data — bars: gross sales, line: cash actually cleared (lag of ~2 days)
  const cashFlow = [
    { label: "Sat", gross: 12500, cleared:  8400 },
    { label: "Sun", gross: 18200, cleared: 11000 },
    { label: "Mon", gross:  9600, cleared: 12500 },
    { label: "Tue", gross: 21800, cleared: 15800 },
    { label: "Wed", gross: 14200, cleared: 18200 },
    { label: "Thu", gross: 18900, cleared:  9600 },
    { label: "Fri", gross: 24500, cleared: 21800 },
  ];
  const cashStats = {
    totalSold:    119700,
    actuallyEarned: 95760,  // after fee, RTO, returns
    cashWithCourier: 38200, // floating COD
    readyToWithdraw: 24000,
  };

  // Operational leakage
  const ops = {
    delivered: 82,
    customerRejected: 9,
    rtoInTransit: 6,
    sellerCancelled: 3,
    rtoPct: 15,
    avgProcessHours: 6.5,
    cancelPct: 3,
  };

  // Inventory velocity
  const topMovers = [
    { label: "Pashmina Maroon",       value: 18, suffix: " units/wk" },
    { label: "Brass Diyo (pair)",     value: 15, suffix: " units/wk" },
    { label: "Green Cotton Kurta",    value: 12, suffix: " units/wk" },
    { label: "Tibetan Singing Bowl",  value:  9, suffix: " units/wk" },
    { label: "Dhaka Topi",            value:  7, suffix: " units/wk" },
  ];
  const slowMovers = [
    { label: "Lokta Journal",   value: 0, suffix: " in 30 days" },
    { label: "Felt Slippers",   value: 1, suffix: " in 30 days" },
    { label: "Wool Cap",        value: 2, suffix: " in 30 days" },
    { label: "Pashmina Beige",  value: 2, suffix: " in 30 days" },
    { label: "Singing Bowl S",  value: 3, suffix: " in 30 days" },
  ];
  const lowStockSoon = [
    { name: "Dhaka Topi",         left: 2, daysLeft: 2 },
    { name: "Lokta Journal",      left: 0, daysLeft: 0 },
    { name: "Pashmina Maroon",    left: 4, daysLeft: 3 },
  ];
  const deadStockValue = 18450;

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>How I'm doing <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· विश्लेषण</span></h1>
        {tab === "trends" && (
          <ChipGroup options={[{ value: "week", label: "7 days" }, { value: "month", label: "30 days" }, { value: "year", label: "1 year" }]} value={range} onChange={setRange} />
        )}
      </div>
      <p style={{ margin: "0 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>See your numbers and what to do next.</p>

      {/* Big tab switch */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          { id: "trends",  icon: "trendingUp", en: "My numbers",   ne: "मेरा संख्या" },
          { id: "actions", icon: "zap",        en: "What to do",   ne: "के गर्ने" },
          { id: "files",   icon: "download",   en: "Download",     ne: "डाउनलोड" },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: active ? "var(--tint-red-50)" : "#fff", border: `1.5px solid ${active ? "var(--red)" : "var(--line-200)"}`, color: active ? "var(--red)" : "var(--ink-700)", borderRadius: "var(--r-md)", padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <Icon name={t.icon} size={20} color={active ? "var(--red)" : "var(--ink-700)"} />
              <div style={{ fontSize: ".875rem" }}>{t.en}</div>
              <div className="ne" style={{ fontSize: ".68rem", color: "var(--ink-500)", fontWeight: 600 }}>{t.ne}</div>
            </button>
          );
        })}
      </div>

      {tab === "trends" && (
        <>
          {/* Cash Flow Command Center — the seller's biggest daily worry */}
          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon name="wallet" size={20} color="var(--success)" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Cash flow</h3>
            </div>
            <p style={{ margin: "2px 0 14px", fontSize: ".75rem", color: "var(--ink-500)" }}>Sold money vs. money actually in your bank. The gap is cash stuck with courier.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
              {[
                { v: cashStats.totalSold,        k: "Total sold",          ne: "कुल बिक्री",       c: "var(--blue-deep)" },
                { v: cashStats.actuallyEarned,   k: "Actually earned",     ne: "साँच्चै कमाएको",  c: "var(--success)" },
                { v: cashStats.cashWithCourier,  k: "Cash with courier",   ne: "कुरियरसँग",       c: "var(--saffron)" },
                { v: cashStats.readyToWithdraw,  k: "Ready to withdraw",   ne: "निकाल्न मिल्ने",   c: "var(--red)" },
              ].map(s => (
                <div key={s.k} style={{ padding: 12, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)" }}>
                  <div className="tnum" style={{ fontSize: "1.125rem", fontWeight: 800, color: s.c }}>Rs. {s.v.toLocaleString()}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-700)", fontWeight: 700, marginTop: 2 }}>{s.k}</div>
                  <div className="ne" style={{ fontSize: ".68rem", color: "var(--ink-500)" }}>{s.ne}</div>
                </div>
              ))}
            </div>
            <SellerCashFlowChart data={cashFlow} height={180} />
            <div style={{ marginTop: 12, background: "var(--tint-blue-50)", padding: 10, borderRadius: "var(--r-md)", fontSize: ".8125rem", color: "var(--blue-deep)" }}>
              <Icon name="badgeCheck" size={14} color="var(--blue)" style={{ verticalAlign: "middle", marginRight: 6 }} />
              Rs. {cashStats.cashWithCourier.toLocaleString()} stuck with courier — usually clears in 2 days.
            </div>
          </div>

          <div className="bz-seller-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }}>
            <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Sales trend</h3>
              <SellerBarChart data={salesByDay} height={220} />
            </div>
            <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Buyer journey</h3>
              <p style={{ margin: "0 0 14px", fontSize: ".75rem", color: "var(--ink-500)" }}>Where buyers drop off</p>
              <SellerFunnel rows={funnel} />
            </div>
          </div>

          {/* Operational leakage tracker */}
          <div className="bz-seller-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }}>
            <div style={{ background: "#fff", border: `1.5px solid ${ops.rtoPct > 12 ? "var(--danger)" : "var(--line-200)"}`, borderRadius: "var(--r-lg)", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon name="returns" size={20} color="var(--danger)" />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Money leaks</h3>
              </div>
              <p style={{ margin: "2px 0 14px", fontSize: ".75rem", color: "var(--ink-500)" }}>Where you lose money before it reaches your bank.</p>
              <SellerDonut size={140} slices={[
                { label: "Delivered OK",         value: ops.delivered,        color: "var(--success)" },
                { label: "Buyer rejected COD",   value: ops.customerRejected, color: "var(--danger)" },
                { label: "Returned to you (RTO)",value: ops.rtoInTransit,     color: "var(--saffron)" },
                { label: "You cancelled",        value: ops.sellerCancelled,  color: "var(--ink-400)" },
              ]} />
              <div style={{ marginTop: 12, padding: 10, background: ops.rtoPct > 12 ? "var(--tint-red-50)" : "var(--line-100)", borderRadius: "var(--r-md)", fontSize: ".8125rem", color: ops.rtoPct > 12 ? "var(--danger)" : "var(--ink-700)" }}>
                <b>{ops.rtoPct}% returned undelivered.</b> {ops.rtoPct > 12 ? "Too high — call buyers to confirm COD before shipping." : "Healthy level."}
              </div>
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: 8, border: "1px solid var(--line-200)", borderRadius: "var(--r-sm)" }}>
                  <div className="tnum" style={{ fontWeight: 800 }}>{ops.avgProcessHours}h</div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Avg pack-and-ship time</div>
                </div>
                <div style={{ padding: 8, border: "1px solid var(--line-200)", borderRadius: "var(--r-sm)" }}>
                  <div className="tnum" style={{ fontWeight: 800 }}>{ops.cancelPct}%</div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Cancelled by you</div>
                </div>
              </div>
            </div>

            {/* Inventory velocity */}
            <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon name="store" size={20} color="var(--saffron)" />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Stock health</h3>
              </div>
              <p style={{ margin: "2px 0 14px", fontSize: ".75rem", color: "var(--ink-500)" }}>What's flying and what's gathering dust.</p>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: ".8125rem", fontWeight: 800, color: "var(--success)", marginBottom: 8 }}>Top 5 fastest movers</div>
                <SellerVelocityBars rows={topMovers} color="var(--success)" />
              </div>

              <div>
                <div style={{ fontSize: ".8125rem", fontWeight: 800, color: "var(--danger)", marginBottom: 8 }}>5 slowest (consider discount)</div>
                <SellerVelocityBars rows={slowMovers} color="var(--danger)" />
              </div>

              <div style={{ marginTop: 14, padding: 10, background: "var(--tint-red-50)", borderRadius: "var(--r-md)", fontSize: ".8125rem", color: "var(--danger)" }}>
                <b>Running out in &lt; 5 days:</b>
                <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                  {lowStockSoon.map(l => <li key={l.name}>{l.name} — {l.left} left ({l.daysLeft}d)</li>)}
                </ul>
              </div>
              <div style={{ marginTop: 8, padding: 10, background: "var(--line-100)", borderRadius: "var(--r-md)", fontSize: ".8125rem" }}>
                <b>Sitting too long:</b> Rs. {deadStockValue.toLocaleString()} of stock unsold 30+ days.
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>Buyers who came back</h3>
            <p style={{ margin: "0 0 14px", fontSize: ".75rem", color: "var(--ink-500)" }}>Of first-time buyers from each month, how many bought again later.</p>
            <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, fontSize: ".8125rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--ink-500)", fontWeight: 700, fontSize: ".7rem" }}>Joined</th>
                  <th style={{ padding: "6px 8px", color: "var(--ink-500)", fontWeight: 700, fontSize: ".7rem" }}>First buy</th>
                  <th style={{ padding: "6px 8px", color: "var(--ink-500)", fontWeight: 700, fontSize: ".7rem" }}>1 mo later</th>
                  <th style={{ padding: "6px 8px", color: "var(--ink-500)", fontWeight: 700, fontSize: ".7rem" }}>2 mo later</th>
                  <th style={{ padding: "6px 8px", color: "var(--ink-500)", fontWeight: 700, fontSize: ".7rem" }}>3 mo later</th>
                </tr>
              </thead>
              <tbody>
                {cohort.map(row => (
                  <tr key={row.m}>
                    <td style={{ padding: "6px 8px", fontWeight: 700 }}>{row.m}</td>
                    {[row.new, row.m1, row.m2, row.m3].map((v, i) => {
                      if (v === null) return <td key={i} style={{ padding: 0 }}><div style={{ background: "var(--line-100)", height: 36, borderRadius: 6 }} /></td>;
                      const pct = i === 0 ? 1 : v / row.new;
                      return (
                        <td key={i} style={{ padding: 0 }}>
                          <div className="tnum" style={{ background: `rgba(29,78,216,${0.1 + pct * 0.6})`, color: pct > 0.4 ? "#fff" : "var(--ink-900)", height: 36, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                            {v}{i > 0 && <span style={{ fontSize: ".65rem", opacity: .8, marginLeft: 4 }}>({Math.round(pct * 100)}%)</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {tab === "actions" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {REPORT_CARDS.map(c => (
            <div key={c.title} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--line-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={c.icon} size={22} color={c.color} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{c.title}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{c.sub}</div>
                </div>
                <div className="tnum" style={{ fontWeight: 800, fontSize: "1.5rem", color: c.color }}>{c.count}</div>
              </div>
              {c.items.length > 0 && (
                <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: ".8125rem", color: "var(--ink-700)" }}>
                  {c.items.slice(0, 3).map(i => <li key={i} style={{ marginBottom: 2 }}>{i}</li>)}
                </ul>
              )}
              <Button variant="secondary" size="sm" full onClick={() => toast(`${c.action} — opens detail`)}>{c.action}</Button>
            </div>
          ))}
        </div>
      )}

      {tab === "files" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {REPORT_DOWNLOADS.map(d => (
            <button key={d.en} onClick={() => toast(`${d.en} prepared — sent to WhatsApp`)}
              style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
              <Icon name="download" size={20} color="var(--blue)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: ".875rem" }}>{d.en}</div>
                <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>{d.ne}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Reports/KYC/Notifications removed — merged into Analytics/Profile/Settings */

/* ---------- 4.17 Settings (includes Notifications) ---------- */
export const NOTIF_EVENTS = [
  { en: "New order",       ne: "नयाँ अर्डर",        defaults: [true, true,  true,  false] },
  { en: "Bargain offer",   ne: "मोलतोल",         defaults: [true, false, true,  false] },
  { en: "Low stock",       ne: "सामान कम",         defaults: [true, false, true,  false] },
  { en: "New review",      ne: "नयाँ समीक्षा",     defaults: [true, false, false, false] },
  { en: "Payout sent",     ne: "पैसा पठाइयो",       defaults: [true, true,  true,  true] },
  { en: "Policy update",   ne: "नीति परिवर्तन",     defaults: [true, false, false, true] },
];
export const NOTIF_CHANNELS = [
  { en: "In-app",   icon: "bell" },
  { en: "SMS",      icon: "message" },
  { en: "WhatsApp", icon: "headphones" },
  { en: "Email",    icon: "file" },
];

export function SellerSettings() {
  const { toast } = useBz();
  const [tab, setTab] = useState("shop"); // shop | alerts | account
  const [notif, setNotif] = useState(NOTIF_EVENTS.map(e => [...e.defaults]));

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Settings <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· सेटिङ</span></h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>Set up your shop rules and how we send you alerts.</p>

      {/* Big icon-tab switcher */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
        {[
          { id: "shop",    icon: "store", en: "Shop rules",   ne: "पसलका नियम" },
          { id: "alerts",  icon: "bell",  en: "Alerts",       ne: "सूचना" },
          { id: "account", icon: "lock",  en: "Account",      ne: "खाता" },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: active ? "var(--tint-red-50)" : "#fff", border: `1.5px solid ${active ? "var(--red)" : "var(--line-200)"}`, color: active ? "var(--red)" : "var(--ink-700)", borderRadius: "var(--r-md)", padding: "14px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontWeight: 700 }}>
              <Icon name={t.icon} size={22} color={active ? "var(--red)" : "var(--ink-700)"} />
              <div style={{ fontSize: ".875rem" }}>{t.en}</div>
              <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)", fontWeight: 600 }}>{t.ne}</div>
            </button>
          );
        })}
      </div>

      {tab === "shop" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>Shop hours · खुल्ने समय</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: ".75rem", color: "var(--ink-500)", fontWeight: 700, display: "block", marginBottom: 4 }}>Open</label>
                <input type="time" defaultValue="09:00" style={{ width: "100%", height: 44, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)" }} />
              </div>
              <div>
                <label style={{ fontSize: ".75rem", color: "var(--ink-500)", fontWeight: 700, display: "block", marginBottom: 4 }}>Close</label>
                <input type="time" defaultValue="19:00" style={{ width: "100%", height: 44, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)" }} />
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>Return policy · फिर्ता नीति</h3>
            <select defaultValue="7" style={{ width: "100%", height: 44, padding: "0 12px", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", marginBottom: 10 }}>
              <option value="0">No returns</option>
              <option value="3">3-day return</option>
              <option value="7">7-day return (recommended)</option>
              <option value="14">14-day return</option>
            </select>
            <textarea placeholder="Notes for buyers about returns…" style={{ width: "100%", minHeight: 60, padding: 10, border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", fontFamily: "var(--font-sans)", fontSize: ".875rem", outline: "none", resize: "vertical" }} />
          </div>

          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>Where you ship · डेलिभरी क्षेत्र</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {["Kathmandu Valley", "Pokhara", "Biratnagar", "Butwal", "Dharan", "Nepalgunj", "Birgunj", "Anywhere in Nepal"].map(z => (
                <label key={z} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: ".875rem" }}>
                  <input type="checkbox" defaultChecked={["Kathmandu Valley", "Pokhara"].includes(z)} style={{ width: 18, height: 18, accentColor: "var(--red)" }} />
                  {z}
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: ".9375rem", fontWeight: 800 }}>Shop on holiday · बिदामा</h3>
              <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>Hide all listings without losing data. Switch back anytime.</p>
            </div>
            <label style={{ position: "relative", width: 52, height: 30, display: "inline-block" }}>
              <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: "absolute", inset: 0, background: "var(--line-200)", borderRadius: 999, cursor: "pointer" }} />
            </label>
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: ".875rem", color: "var(--ink-500)" }}>Pick how we tell you about each thing. New-order alerts are always on.</p>
          <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr style={{ background: "var(--line-100)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: ".7rem", fontWeight: 700, color: "var(--ink-500)", letterSpacing: ".06em", textTransform: "uppercase" }}>Tell me about</th>
                  {NOTIF_CHANNELS.map(c => (
                    <th key={c.en} style={{ padding: "12px 12px", fontSize: ".7rem", fontWeight: 700, color: "var(--ink-500)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name={c.icon} size={14} /> {c.en}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIF_EVENTS.map((e, ri) => (
                  <tr key={e.en} style={{ borderTop: "1px solid var(--line-200)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700 }}>{e.en}</div>
                      <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>{e.ne}</div>
                    </td>
                    {NOTIF_CHANNELS.map((_, ci) => (
                      <td key={ci} style={{ padding: "14px 12px", textAlign: "center" }}>
                        <input type="checkbox" checked={notif[ri][ci]}
                          onChange={() => setNotif(s => s.map((row, i) => i === ri ? row.map((v, j) => j === ci ? !v : v) : row))}
                          style={{ width: 20, height: 20, accentColor: "var(--red)", cursor: "pointer" }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "account" && (
        <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {[
            { icon: "lock",   en: "Change PIN",        sub: "Last updated 30 days ago" },
            { icon: "phone",  en: "Change phone",      sub: "+977 98XXXXXXXX" },
            { icon: "image",  en: "Profile photo",     sub: "Upload your face — buyers trust real people" },
            { icon: "palette",en: "Language",          sub: "English + नेपाली" },
          ].map((r, i, a) => (
            <button key={r.en} onClick={() => toast(`${r.en} — opens detail`)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 16, background: "#fff", border: "none", borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none", cursor: "pointer", textAlign: "left" }}>
              <Icon name={r.icon} size={22} color="var(--ink-700)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{r.en}</div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
              </div>
              <Icon name="chevronRight" size={18} color="var(--ink-400)" />
            </button>
          ))}
        </div>
      )}

      <Button variant="primary" size="lg" full onClick={() => toast("Saved")} style={{ marginTop: 18 }}>Save</Button>
    </div>
  );
}

/* ---------- 4.18 Profile (includes KYC) ---------- */
export function SellerProfile() {
  const { nav, toast, setAuthed } = useBz();
  const kycItems = [
    { en: "PAN card",        ne: "प्यान कार्ड",       status: "verified", note: "601234567 · checked 12 Apr" },
    { en: "Owner photo",     ne: "मालिकको फोटो",     status: "verified", note: "Pemba Sherpa · matched" },
    { en: "Shop address",    ne: "पसलको ठेगाना",     status: "verified", note: "Suryabinayak-4, Bhaktapur" },
    { en: "Bank / wallet",   ne: "बैंक / वालेट",      status: "verified", note: "eSewa · 98XXXXXXXX" },
    { en: "Tax certificate", ne: "करको प्रमाणपत्र", status: "pending",  note: "Needed once monthly sales cross Rs. 1,00,000" },
  ];

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>My profile <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>· प्रोफाइल</span></h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>Your info, your shop documents, and the log-out button.</p>

      {/* Owner card */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 20, display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--tint-red-50)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem" }}>P</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "1.125rem" }}>Pemba Sherpa</div>
          <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>Bhaktapur Handicraft Bhandar · <span style={{ color: "var(--success)", fontWeight: 700 }}><Icon name="badgeCheck" size={14} color="var(--success)" style={{ verticalAlign: "middle" }} /> Verified</span></div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>Joined Apr 2026 · 47 orders this week</div>
        </div>
      </div>

      {/* My info */}
      <h2 style={{ margin: "10px 0 8px", fontSize: ".9375rem", fontWeight: 800, color: "var(--blue-deep)" }}>My info · मेरो जानकारी</h2>
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 16 }}>
        {[
          { icon: "user",   en: "Owner name",     sub: "Pemba Sherpa" },
          { icon: "phone",  en: "Phone number",   sub: "+977 98XXXXXXXX" },
          { icon: "mapPin", en: "Pickup address", sub: "Suryabinayak-4, Bhaktapur" },
          { icon: "lock",   en: "Change PIN",     sub: "Last updated 30 days ago" },
        ].map((r, i, a) => (
          <button key={r.en} onClick={() => toast(`Edit ${r.en}`)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 16, background: "#fff", border: "none", borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none", cursor: "pointer", textAlign: "left" }}>
            <Icon name={r.icon} size={22} color="var(--ink-700)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{r.en}</div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
            </div>
            <Icon name="chevronRight" size={18} color="var(--ink-400)" />
          </button>
        ))}
      </div>

      {/* Shop documents (KYC) */}
      <h2 style={{ margin: "10px 0 8px", fontSize: ".9375rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        <Icon name="shieldCheck" size={18} color="var(--success)" style={{ verticalAlign: "middle", marginRight: 6 }} />
        Shop documents · पसलका कागजात
      </h2>
      <p style={{ margin: "0 0 10px", fontSize: ".8125rem", color: "var(--ink-500)" }}>These prove your shop is real. Buyers see your verified badge.</p>
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 16 }}>
        {kycItems.map((it, i) => (
          <div key={it.en} style={{ padding: 14, borderBottom: i < kycItems.length - 1 ? "1px solid var(--line-200)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name={it.status === "verified" ? "check" : "clock"} size={22} color={it.status === "verified" ? "var(--success)" : "var(--saffron)"} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: ".9375rem" }}>{it.en} <span className="ne" style={{ fontWeight: 600, color: "var(--ink-500)", fontSize: ".75rem" }}>· {it.ne}</span></div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 1 }}>{it.note}</div>
            </div>
            <Button variant="ghost" size="sm" icon="edit" onClick={() => toast(`Update ${it.en}`)}>Update</Button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" full onClick={() => { setAuthed(false); nav("home"); }}>Log out</Button>
        <Button variant="danger"    full onClick={() => toast("Account deletion requested — we'll call you")}>Delete account</Button>
      </div>
    </div>
  );
}

/* ---------- NEW: Simple Analytics ("My shop") for non-tech 40+ users ---------- */

export function SellerAnalytics() {
  const salesByDay = [
    { label: "Sat", value: 12500 }, { label: "Sun", value: 18200 }, { label: "Mon", value: 9600 },
    { label: "Tue", value: 21800 }, { label: "Wed", value: 14200 }, { label: "Thu", value: 18900 },
    { label: "Fri", value: 24500, highlight: true },
  ];
  const topProducts = [
    { name: "Pashmina Shawl — Maroon",  units: 18, rev: 44100, icon: "shirt", tint: "red"   },
    { name: "Green Cotton Kurta",       units: 12, rev: 14400, icon: "shirt", tint: "green" },
    { name: "Brass Diyo (pair)",        units: 15, rev: 20250, icon: "home",  tint: "gold"  },
  ];
  const moneyBuckets = [
    { en: "In my bank",      ne: "मेरो बैंकमा",     v: 24000, c: "var(--success)" },
    { en: "Sold today",      ne: "आज बेचेको",      v: 24500, c: "var(--blue-deep)" },
    { en: "With courier",    ne: "कुरियरसँग",     v: 38200, c: "var(--saffron)" },
    { en: "Returns / on hold",ne: "रोकिएको",       v:  1840, c: "var(--danger)" },
  ];
  const maxBucket = Math.max(...moneyBuckets.map(b => b.v));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />

      <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}>My shop</h1>
      <p className="ne" style={{ margin: "4px 0 18px", color: "var(--ink-500)", fontSize: ".95rem" }}>मेरो पसल — हालको हालचाल</p>

      {/* Big "today" hero */}
      <div style={{ background: "linear-gradient(135deg, #0a2e6b 0%, #1e3a8a 100%)", borderRadius: "var(--r-lg)", padding: 26, color: "#fff", marginBottom: 18 }}>
        <div style={{ fontSize: ".95rem", opacity: .85 }}>Today you sold</div>
        <div className="tnum bz-stat-xl" style={{ fontWeight: 800, letterSpacing: "-.02em", margin: "6px 0 4px" }}>Rs. 24,500</div>
        <div style={{ fontSize: ".9rem", opacity: .85 }}>From 12 orders. Yesterday: Rs. 18,900.</div>
      </div>

      {/* Sales last 7 days */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--blue-deep)" }}>Sales — last 7 days</h2>
        <p className="ne" style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}>७ दिनको बिक्री</p>
        <SellerBarChart data={salesByDay} height={200} />
        <p style={{ marginTop: 12, padding: 10, background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", fontSize: ".875rem", color: "var(--blue-deep)" }}>
          <Icon name="badgeCheck" size={14} color="var(--blue)" style={{ verticalAlign: "middle", marginRight: 6 }} />
          Friday was your best day. Try posting new products Friday morning.
        </p>
      </div>

      {/* Where my money is — replaces cohort/funnel complexity */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--blue-deep)" }}>Where my money is</h2>
        <p className="ne" style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}>मेरो पैसा कहाँ छ</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {moneyBuckets.map(b => {
            const pct = (b.v / maxBucket) * 100;
            return (
              <div key={b.en}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{b.en}</span>
                    <span className="ne" style={{ marginLeft: 8, color: "var(--ink-500)", fontSize: ".75rem", fontWeight: 600 }}>{b.ne}</span>
                  </div>
                  <span className="tnum" style={{ fontWeight: 800, fontSize: "1.05rem", color: b.c }}>Rs. {b.v.toLocaleString()}</span>
                </div>
                <div style={{ height: 14, background: "var(--line-100)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: b.c, borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ marginTop: 14, padding: 10, background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", fontSize: ".875rem", color: "var(--blue-deep)" }}>
          <Icon name="badgeCheck" size={14} color="var(--blue)" style={{ verticalAlign: "middle", marginRight: 6 }} />
          Rs. 38,200 is with courier. Comes to your bank in 2 days.
        </p>
      </div>

      {/* Top 3 sellers */}
      <div style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 22, marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--blue-deep)" }}>Your top 3 items this week</h2>
        <p className="ne" style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}>सबभन्दा बढी बिक्ने</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topProducts.map((p, i) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "var(--gold)" : "var(--line-200)", color: i === 0 ? "#fff" : "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <Placeholder icon={p.icon} tint={p.tint} style={{ width: 56, height: 56, flexShrink: 0 }} radius="var(--r-sm)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{p.name}</div>
                <div className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>{p.units} sold</div>
              </div>
              <div className="tnum" style={{ fontWeight: 800, color: "var(--success)", fontSize: "1rem" }}>Rs. {p.rev.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <p style={{ textAlign: "center", color: "var(--ink-500)", fontSize: ".875rem" }}>
        Want to know what to fix? Open <b>What to do · के गर्ने</b> in the sidebar.
      </p>
    </div>
  );
}

/* ---------- NEW: Reports ("What to do") ---------- */

export function SellerReports() {
  const { toast, nav } = useBz();

  const cards = [
    {
      icon: "refresh", color: "var(--saffron)",
      title: "Restock these now",
      ne: "यी सामान सकिँदै",
      sub: "3 items will run out in less than 5 days",
      action: "See list",
      items: ["Dhaka Topi — only 2 left", "Lokta Journal — 0 left", "Pashmina Maroon — 4 left"],
      to: "s-products",
    },
    {
      icon: "trendingUp", color: "var(--success)",
      title: "Hot this week — make a video",
      ne: "यो हप्ता राम्रो",
      sub: "These items are selling 50% more than last week",
      action: "Open videos",
      items: ["Brass Diyo — selling 2× more", "Tibetan Singing Bowl — selling 1.7× more"],
      to: "s-videos",
    },
    {
      icon: "trendingDown", color: "var(--danger)",
      title: "Sitting too long — give a discount",
      ne: "धेरै दिनदेखि नबिकेको",
      sub: "4 items had no sale in last 14 days",
      action: "Start offer",
      items: ["Wool Cap", "Pashmina Beige", "Singing Bowl Small", "Felt Slippers"],
      to: "s-promos",
    },
    {
      icon: "returns", color: "var(--danger)",
      title: "Too many returns",
      ne: "धेरै फिर्ता",
      sub: "15 of 100 orders came back undelivered. Healthy is below 10.",
      action: "Call buyers to confirm",
      items: ["Tip: Call COD buyers before shipping. Verify their address."],
      to: "s-inbox",
    },
    {
      icon: "user", color: "var(--blue)",
      title: "Buyers who didn't come back",
      ne: "फेरि नआएका खरिदकर्ता",
      sub: "18 buyers bought once 30+ days ago. Send a coupon.",
      action: "Make coupon",
      items: [],
      to: "s-promos",
    },
    {
      icon: "wallet", color: "var(--saffron)",
      title: "Rs. 38,200 stuck with courier",
      ne: "कुरियरसँग रोकिएको",
      sub: "Cash on Delivery money — comes in 2 days. Nothing to do.",
      action: "See payouts",
      items: [],
      to: "s-ledger",
    },
  ];

  const downloads = [
    { en: "Tax report (PDF)",        ne: "कर रिपोर्ट",         icon: "file"  },
    { en: "Sales this month (CSV)",   ne: "मासिक बिक्री",       icon: "file"  },
    { en: "All my buyers (CSV)",      ne: "खरिदकर्ता सूची",      icon: "user"  },
    { en: "Current stock (CSV)",      ne: "मौजुदा सामान",        icon: "store" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}>What to do this week</h1>
      <p className="ne" style={{ margin: "4px 0 4px", color: "var(--ink-500)", fontSize: ".95rem" }}>यो हप्ता के गर्ने</p>
      <p style={{ margin: "0 0 18px", color: "var(--ink-500)", fontSize: ".9rem" }}>Things to act on, and your reports to save or share.</p>

      {/* Downloads moved TO TOP — visible without scrolling */}
      <div style={{ background: "linear-gradient(135deg, var(--tint-blue-50) 0%, rgba(22,163,74,.06) 100%)", border: "1.5px solid var(--blue)", borderRadius: "var(--r-lg)", padding: 18, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="download" size={22} color="#fff" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}>Get my reports</h2>
            <p className="ne" style={{ margin: "2px 0 0", color: "var(--ink-500)", fontSize: ".8125rem" }}>रिपोर्ट निकाल्नुहोस् — Tap one, we send it to your WhatsApp.</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {downloads.map(d => (
            <button key={d.en} onClick={() => toast(`${d.en} sent to WhatsApp · प्राप्त भयो`)}
              style={{ background: "#fff", border: "1.5px solid var(--blue)", borderRadius: "var(--r-md)", padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
              <Icon name={d.icon} size={22} color="var(--blue)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: ".9rem", color: "var(--ink-900)" }}>{d.en}</div>
                <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>{d.ne}</div>
              </div>
              <Icon name="download" size={18} color="var(--blue)" />
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <h2 style={{ margin: "0 0 4px", fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}>Things to act on</h2>
      <p className="ne" style={{ margin: "0 0 14px", color: "var(--ink-500)", fontSize: ".8125rem" }}>के-के गर्ने</p>

      <div style={{ display: "grid", gap: 12 }}>
        {cards.map(c => (
          <div key={c.title} style={{ background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ width: 52, height: 52, borderRadius: "var(--r-md)", background: "var(--line-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={c.icon} size={26} color={c.color} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 800, color: "var(--ink-900)" }}>{c.title}</h3>
                <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>{c.ne}</div>
                <p style={{ margin: "8px 0 0", color: "var(--ink-700)", fontSize: ".9rem" }}>{c.sub}</p>
                {c.items.length > 0 && (
                  <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "var(--ink-700)", fontSize: ".875rem", lineHeight: 1.6 }}>
                    {c.items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                )}
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Button variant="primary" size="lg" full icon={c.icon} onClick={() => nav(c.to)}>{c.action}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
