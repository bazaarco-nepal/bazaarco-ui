'use client';
// @ts-nocheck — legacy design prototype; typed incrementally


import React, { useState } from "react";
import { Icon, Logo, Button, Spinner, IconButton, RatingStars, Chip, VerifiedBadge, StatusPill, Price, Placeholder, VideoPlayer, SkeletonCard, EmptyState, QtyStepper, Toast, SectionHead, TINTS, HelpLifeline, AllInPriceCard, OTPInput, MenuRow, ChipGroup, MobileBuyBar, BottomNav, LandmarkAddress, VoiceMicButton, usePaged, usePages, LoadMore, PageBar, BackToTop } from "@/components/ui";
import { CATEGORIES, ATTR_CATEGORIES, CATEGORY_ATTRIBUTES, PRODUCTS, SELLERS, REVIEWS, byId, sellerOf, inCat, videoProducts, flashProducts, productProfile, P } from "@/constants/catalog";
import { BazaarCtx, useBz, Himalaya, KathmanduSkyline, ProductCard, ProductRail, CategoryTile, Navbar, Footer, DevViewSwitcher } from "@/components/common";


export function priceBreakdown(cart) {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = subtotal >= 1000 || subtotal === 0 ? 0 : 100;
  const discount = cart.some(it => it.coupon) ? Math.round(subtotal * 0.1) : 0;
  return { subtotal, delivery, discount, total: subtotal + delivery - discount };
}
function Row({ label, value, strong, free, color }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: strong ? "14px 0 0" : "7px 0",
    borderTop: strong ? "1px solid var(--line-200)" : "none", marginTop: strong ? 6 : 0 }}>
    <span style={{ fontSize: strong ? "1rem" : ".875rem", fontWeight: strong ? 700 : 500, color: strong ? "var(--ink-900)" : "var(--ink-500)" }}>{label}</span>
    <span className="tnum" style={{ fontSize: strong ? "1.25rem" : ".9375rem", fontWeight: strong ? 800 : 600, color: color || (strong ? "var(--blue-deep)" : "var(--ink-800)") }}>
      {free ? "Free" : `Rs. ${value.toLocaleString("en-IN")}`}</span></div>;
}

/* ---------- CART ---------- */
export function Cart() {
  const { cart, setCart, nav, openProduct, toast } = useBz();
  const [coupon, setCoupon] = useState("");
  const [confirm, setConfirm] = useState(null);
  const bd = priceBreakdown(cart);
  const setQty = (id, q) => setCart(c => c.map(it => it.id === id ? { ...it, qty: q } : it));
  const remove = (id) => { setCart(c => c.filter(it => it.id !== id)); setConfirm(null); toast("Removed from cart"); };
  const applyCoupon = () => { if (coupon.trim()) { setCart(c => c.map(it => ({ ...it, coupon: true }))); toast("Coupon applied — 10% off"); } };

  if (cart.length === 0) return <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 28px" }}>
    <EmptyState title="Your cart is empty" message="Looks like you haven't added anything yet. Let's find something you'll love." cta="Browse products" onCta={() => nav("browse")} secondary="Watch" onSecondary={() => nav("video")} />
  </div>;

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 0" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        Your cart <span className="tnum" style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: "1rem" }}>· {cart.length} item{cart.length>1?"s":""}</span>
      </h1>
      {/* free-delivery progress */}
      {bd.subtotal < 1000 && bd.subtotal > 0 && (
        <div style={{ background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", padding: 14, margin: "10px 0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem", color: "var(--blue-deep)", marginBottom: 6 }}>
            <span><Icon name="truck" size={16} color="var(--blue-deep)" style={{ verticalAlign: "middle", marginRight: 4 }} /> Add Rs. {(1000 - bd.subtotal).toLocaleString()} more for free delivery</span>
            <span className="tnum" style={{ fontWeight: 700 }}>{Math.round((bd.subtotal / 1000) * 100)}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(29,78,216,.15)", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (bd.subtotal / 1000) * 100)}%`, height: "100%", background: "var(--blue)" }} />
          </div>
        </div>
      )}
      <div className="bz-stack-900" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start", marginTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {cart.map(it => { const s = sellerOf(it); return (
            <div key={it.id} style={{ display: "flex", gap: 16, background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 16 }}>
              <div onClick={() => openProduct(it)} style={{ cursor: "pointer", flexShrink: 0 }}>
                {it.img ? <img src={it.img} alt={it.name} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "var(--r-md)" }} />
                  : <Placeholder icon={it.icon} tint={it.tint} style={{ width: 96, height: 96 }} radius="var(--r-md)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div onClick={() => openProduct(it)} style={{ cursor: "pointer" }}>
                    <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>{it.name}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="badgeCheck" size={13} color="var(--gold)" /> {s.name}</div>
                    {it.coupon && <div style={{ marginTop: 6 }}><Chip tone="success" size="sm" icon="tag">Coupon applied</Chip></div>}
                  </div>
                  <Price value={it.price} size="sm" />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <QtyStepper value={it.qty} onChange={q => setQty(it.id, q)} />
                  <button onClick={() => setConfirm(it)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: ".8125rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon name="x" size={15} /> Remove
                  </button>
                </div>
              </div>
            </div>); })}
          <button onClick={() => nav("browse")} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".9375rem", marginTop: 4 }}><Icon name="chevronLeft" size={16} /> Continue shopping</button>
        </div>

        {/* summary */}
        <div style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Order summary</div>
            <details style={{ marginBottom: 12 }}>
              <summary style={{ cursor: "pointer", color: "var(--blue)", fontWeight: 700, fontSize: ".875rem", listStyle: "none" }}>+ Have a promo code?</summary>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" style={{ flex: 1, height: 40, border: "1px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "0 12px", fontSize: ".875rem", fontFamily: "var(--font-sans)" }} />
                <Button variant="secondary" onClick={applyCoupon}>Apply</Button>
              </div>
            </details>
            <Row label="Subtotal" value={bd.subtotal} />
            <Row label="Delivery" value={bd.delivery} free={bd.delivery === 0} />
            {bd.discount > 0 && <Row label="Discount (10%)" value={bd.discount} color="var(--success)" />}
            <Row label="Total" value={bd.total} strong />
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" full size="lg" iconRight="arrowRight" onClick={() => nav("checkout")}>Checkout · चेकआउट</Button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, color: "var(--ink-400)", fontSize: ".75rem" }}>
              <Icon name="lock" size={13} color="var(--ink-400)" /> Secure checkout · all payment options
            </div>
          </div>
        </div>
      </div>

      {confirm && <ConfirmModal title="Remove item?" message={`Remove "${confirm.name}" from your cart?`} confirmLabel="Remove" onConfirm={() => remove(confirm.id)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(11,18,32,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onCancel}>
    <div className="fade-up" onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "var(--r-xl)", width: 400, padding: 26 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: "1.125rem" }}>{title}</h3>
      <p style={{ margin: "0 0 22px", color: "var(--ink-500)", fontSize: ".9375rem" }}>{message}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="ghost" full onClick={onCancel}>Keep</Button>
        <Button variant="danger" full onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </div>;
}

/* ---------- Section card (collapsible) ---------- */
function CheckoutSection({ n, title, summary, complete, open, onToggle, children }) {
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${open ? "var(--blue)" : "var(--line-200)"}`, borderRadius: "var(--r-lg)", overflow: "hidden", transition: "border-color var(--dur-standard) var(--ease)" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", padding: "18px 20px", cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 32, height: 32, borderRadius: "50%", background: complete ? "var(--success)" : open ? "var(--blue)" : "var(--line-100)",
          color: complete || open ? "#fff" : "var(--ink-400)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
          {complete ? <Icon name="check" size={18} color="#fff" /> : n}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink-900)" }}>{title}</div>
          {summary && !open && <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 3 }}>{summary}</div>}
        </div>
        <Icon name="chevronDown" size={20} color="var(--ink-400)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur-standard)" }} />
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}

/* ---------- CHECKOUT (single page, 3 collapsed sections) ---------- */
export function Checkout() {
  const { cart, nav, placeOrder } = useBz();
  const [openSec, setOpenSec] = useState(2); // 0 phone, 1 address, 2 payment (default jumps to payment since phone auto-filled & address can be edited inline)
  const [phone] = useState("98XXXXXX21");
  const [address, setAddress] = useState({ city: "Kathmandu", area: "Chabahil", landmark: "Next to Bhatbhateni, opposite petrol pump" });
  const [pay, setPay] = useState("esewa");
  const [loading, setLoading] = useState(false);
  const bd = priceBreakdown(cart);
  const total = bd.total;

  const addressComplete = !!(address.city && address.area && address.landmark);

  const submit = () => { setLoading(true); setTimeout(() => { setLoading(false); placeOrder(total); }, 1600); };

  const payMethods = [
    { id: "esewa", name: "eSewa", desc: "Pay instantly with your eSewa wallet", icon: "wallet", tint: "green" },
    { id: "khalti", name: "Khalti", desc: "Khalti digital wallet", icon: "wallet", tint: "purple" },
    { id: "fonepay", name: "Fonepay", desc: "Fonepay QR / interbank", icon: "wallet", tint: "blue" },
    { id: "card", name: "Card", desc: "Visa, Mastercard, debit or credit", icon: "lock", tint: "slate" },
    { id: "cod", name: "Cash on Delivery", desc: `Pay Rs. ${total.toLocaleString()} when delivered`, icon: "wallet", tint: "slate" },
  ];

  const payLabel = pay === "cod"
    ? `Confirm order — Pay Rs. ${total.toLocaleString()} on delivery`
    : `Pay Rs. ${total.toLocaleString()} via ${payMethods.find(m => m.id === pay).name}`;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 28px 80px" }}>
      <button onClick={() => nav("cart")} style={{ background: "none", border: "none", color: "var(--ink-500)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: ".875rem" }}>
        <Icon name="chevronLeft" size={16} /> Back to cart
      </button>

      <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Checkout · चेकआउट</h1>
      <p style={{ margin: "0 0 20px", color: "var(--ink-500)", fontSize: ".9375rem" }}>Three quick steps. No emails, no passwords.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <CheckoutSection
          n={1}
          title="Phone (auto-filled)"
          summary={`+977 ${phone} · ✓ verified`}
          complete
          open={openSec === 0}
          onToggle={() => setOpenSec(openSec === 0 ? -1 : 0)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--line-100)", borderRadius: "var(--r-md)" }}>
            <span style={{ fontWeight: 700, fontSize: ".9375rem", color: "var(--ink-700)" }}>+977</span>
            <span className="tnum" style={{ fontSize: "1rem", color: "var(--ink-900)" }}>{phone}</span>
            <span style={{ marginLeft: "auto" }}><Chip tone="success" icon="check">verified</Chip></span>
          </div>
          <p style={{ fontSize: ".8125rem", color: "var(--ink-400)", marginTop: 10 }}>This is the phone we used to log you in. Updates go via SMS.</p>
        </CheckoutSection>

        <CheckoutSection
          n={2}
          title="Delivery address"
          summary={addressComplete ? `${address.area}, ${address.city} · ${address.landmark}` : "Set your delivery address"}
          complete={addressComplete}
          open={openSec === 1}
          onToggle={() => setOpenSec(openSec === 1 ? -1 : 1)}>
          <LandmarkAddress value={address} onChange={setAddress} />
          <div style={{ marginTop: 14 }}>
            <Button variant="primary" full onClick={() => setOpenSec(2)} disabled={!addressComplete}>Save address</Button>
          </div>
        </CheckoutSection>

        <CheckoutSection
          n={3}
          title="Payment method"
          summary={payMethods.find(m => m.id === pay).name}
          complete={!!pay}
          open={openSec === 2}
          onToggle={() => setOpenSec(openSec === 2 ? -1 : 2)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {payMethods.map(m => (
              <button key={m.id} onClick={() => setPay(m.id)} style={{ width: "100%", textAlign: "left", display: "flex", gap: 14, padding: 14, borderRadius: "var(--r-md)", cursor: "pointer",
                border: `1.5px solid ${pay === m.id ? "var(--blue)" : "var(--line-200)"}`,
                background: pay === m.id ? "var(--tint-blue-50)" : "#fff", alignItems: "center" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${pay === m.id ? "var(--blue)" : "var(--line-200)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {pay === m.id && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--blue)" }} />}
                </span>
                <span style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", background: TINTS[m.tint][0], color: TINTS[m.tint][2], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={m.icon} size={20} color={TINTS[m.tint][2]} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: ".9375rem" }}>{m.name}</b>
                    {m.recommended && <Chip tone="success" size="sm">Recommended</Chip>}
                  </div>
                  <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {pay === "cod" && (
            <div style={{ marginTop: 14, background: "var(--tint-blue-50)", borderRadius: "var(--r-md)", padding: 12, fontSize: ".8125rem", color: "var(--blue)", display: "flex", gap: 8 }}>
              <Icon name="shieldCheck" size={18} color="var(--blue)" style={{ flexShrink: 0 }} />
              <span>For cash on delivery, our delivery person may call to check your address before sending. Please keep your phone reachable.</span>
            </div>
          )}
        </CheckoutSection>
      </div>

      {/* Cancellation + refund policy — shown before order is placed */}
      <PolicyDisclosure pay={pay} />

      {/* Confirm bar */}
      <div style={{ marginTop: 14, background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 20 }}>
        <Row label="Subtotal" value={bd.subtotal} />
        <Row label="Delivery" value={bd.delivery} free={bd.delivery === 0} />
        {bd.discount > 0 && <Row label="Discount" value={bd.discount} color="var(--success)" />}
        <Row label="Total" value={total} strong />
        <div style={{ marginTop: 18 }}>
          <Button variant="primary" full size="lg" loading={loading} onClick={submit} disabled={!addressComplete}>
            {loading ? "Placing order…" : payLabel}
          </Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 12, color: "var(--ink-400)", fontSize: ".75rem" }}>
          <Icon name="lock" size={13} color="var(--ink-400)" /> Your details are safe with us
          <span style={{ width: 1, height: 12, background: "var(--line-200)" }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {["eSewa", "Khalti", "Fonepay"].map(n => <span key={n} style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--ink-500)" }}>{n}</span>)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Cancellation + Refund policy disclosure (checkout) ---------- */
function refundWindow(pay) {
  if (pay === "card") return "5–7 working days to your card";
  if (pay === "cod") return "1–3 working days to your BazaarCo wallet";
  return "1–3 working days to your wallet"; // eSewa / Khalti / Fonepay
}
function PolicyDisclosure({ pay }) {
  const rows = [
    { icon: "x", en: "Free cancellation before your order ships", ne: "ढुवानी हुनुअघि निःशुल्क रद्द" },
    { icon: "returns", en: "7-day returns if the item is damaged, wrong, or not as described", ne: "७ दिनभित्र फिर्ता — बिग्रेको वा गलत भए" },
    { icon: "refresh", en: `Refunds after the return is approved — ${refundWindow(pay)}`, ne: "फिर्ता स्वीकृत भएपछि रिफन्ड" },
  ];
  return (
    <div style={{ marginTop: 22, background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-lg)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "1rem", color: "var(--ink-900)", marginBottom: 4 }}>
        <Icon name="shieldCheck" size={18} color="var(--blue)" /> Cancellation &amp; refunds
        <span className="ne" style={{ fontWeight: 600, color: "var(--ink-400)", fontSize: ".8125rem" }}>· रद्द र फिर्ता</span>
      </div>
      <p style={{ margin: "0 0 14px", color: "var(--ink-500)", fontSize: ".8125rem" }}>Know your rights before you pay. No fine print.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 28, height: 28, borderRadius: "var(--r-sm)", background: "var(--tint-blue-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={r.icon} size={16} color="var(--blue)" />
            </span>
            <div>
              <div style={{ fontSize: ".875rem", color: "var(--ink-800)", fontWeight: 500 }}>{r.en}</div>
              <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 1 }}>{r.ne}</div>
            </div>
          </div>
        ))}
      </div>
      <details style={{ marginTop: 14, borderTop: "1px solid var(--line-200)", paddingTop: 12 }}>
        <summary style={{ cursor: "pointer", color: "var(--blue)", fontWeight: 700, fontSize: ".8125rem", listStyle: "none" }}>Read the full policy</summary>
        <div style={{ marginTop: 10, fontSize: ".8125rem", color: "var(--ink-500)", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--ink-700)" }}>Cancellation.</b> You can cancel free of charge any time before the seller ships your order. Orders may also be cancelled if the seller cannot fulfil them or the order breaks platform policies — you are refunded in full in that case.</p>
          <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--ink-700)" }}>Returns.</b> Submit a return request through BazaarCo within 7 days of delivery. Eligibility depends on the product condition, the seller's return policy, and the return window. Damaged, wrong, or not-as-described items are always covered.</p>
          <p style={{ margin: 0 }}><b style={{ color: "var(--ink-700)" }}>Refunds.</b> Refunds are processed once the return is approved and verified. The timeline depends on your payment method: wallets (eSewa, Khalti, Fonepay) and COD refund to your BazaarCo wallet in 1–3 working days; card payments refund to your card in 5–7 working days.</p>
        </div>
      </details>
    </div>
  );
}

/* ---------- ORDER SUCCESS ---------- */
export function OrderSuccess({ total }) {
  const { nav } = useBz();
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 28px" }}>
      <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--r-xl)", padding: 36, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(22,163,74,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={30} color="#fff" />
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-900)" }}>Order placed! <span className="ne" style={{ color: "var(--ink-500)", fontWeight: 600 }}>· अर्डर सम्पन्न भयो</span></h1>
        <p style={{ color: "var(--ink-500)", marginTop: 8 }}>
          Order <b className="tnum" style={{ color: "var(--ink-900)" }}>#BZ-24501</b> confirmed
          {total > 0 && <> · <span className="tnum">Rs. {total.toLocaleString()}</span></>}
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--tint-blue-50)", color: "var(--blue)", padding: "10px 16px", borderRadius: "var(--r-md)", marginTop: 16, fontWeight: 600, fontSize: ".9375rem" }}>
          <Icon name="truck" size={18} color="var(--blue)" /> Arriving by Tomorrow, May 30
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <Button variant="primary" full size="lg" icon="package" onClick={() => nav("tracking")}>Track order</Button>
          <Button variant="secondary" full size="lg" onClick={() => nav("home")}>Continue shopping</Button>
        </div>
        <Button variant="ghost" full icon="headphones" style={{ marginTop: 10 }}>Need help? Call us</Button>
      </div>
      <p style={{ textAlign: "center", color: "var(--ink-400)", fontSize: ".8125rem", marginTop: 16 }}>SMS confirmation sent to your phone</p>
    </div>
  );
}
