'use client';


import React, { useState, useEffect } from "react";
import { Icon, Logo, Button, Spinner, IconButton, RatingStars, Chip, VerifiedBadge, StatusPill, Price, Placeholder, VideoPlayer, SkeletonCard, EmptyState, QtyStepper, Toast, SectionHead, TINTS, HelpLifeline, AllInPriceCard, OTPInput, MenuRow, ChipGroup, MobileBuyBar, BottomNav, LandmarkAddress, VoiceMicButton, usePaged, usePages, LoadMore, PageBar, BackToTop } from "@/components/ui";
import { BazaarCtx, useBz, Himalaya, KathmanduSkyline, ProductCard, ProductRail, CategoryTile, Navbar, Footer, DevViewSwitcher } from "@/components/common";
import { ASSETS } from "@/config/assets";


export function Splash() {
  const { nav } = useBz();
  const goAuth = () => nav("auth");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goAuth}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goAuth(); } }}
      style={{ minHeight: "calc(100vh - 110px)", background: "var(--page)", display: "flex", flexDirection: "column", cursor: "pointer" }}
    >
      <div style={{ flex: 1, maxWidth: 480, margin: "0 auto", padding: "48px 28px 0", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <img src={ASSETS.mascot} alt="" className="bz-auth-hero-img" style={{ width: 240, height: 240, objectFit: "contain", margin: "0 auto 28px" }} />
        <h1 className="bz-hero-h2" style={{ margin: 0, fontWeight: 800, color: "var(--blue-deep)", letterSpacing: "-.02em" }}>
          Nepal's <span style={{ color: "var(--red)" }}>fair</span> marketplace
        </h1>
        <p className="ne" style={{ color: "var(--ink-500)", fontSize: "1.0625rem", margin: "12px 0 6px" }}>नेपालको इमानदार बजार</p>
        <p style={{ color: "var(--ink-500)", fontSize: "1rem", margin: 0, maxWidth: 360, marginInline: "auto" }}>
          Low fees. Real product videos. Fast delivery across Nepal.
        </p>
      </div>

      <div style={{ padding: "24px 28px 40px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <Button variant="primary" size="lg" full iconRight="arrowRight" onClick={goAuth}>
          Get started · सुरु गर्नुहोस्
        </Button>
        {/* Skip auth — browse as guest. stopPropagation so the splash-wide tap target doesn't also fire goAuth. */}
        <Button variant="ghost" full onClick={(e) => { e.stopPropagation(); nav("home"); }} style={{ marginTop: 10 }}>
          Skip — browse as guest · पछि गर्ने
        </Button>
        <p style={{ textAlign: "center", color: "var(--ink-400)", fontSize: ".8125rem", marginTop: 14 }}>
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}

export function Auth() {
  const { nav, setAuthed } = useBz();
  const [stage, setStage] = useState("phone"); // phone | otp | name
  const [intent, setIntent] = useState("buyer"); // buyer | seller
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [resend, setResend] = useState(28);
  const phoneValid = /^9\d{9}$/.test(phone);
  const isSeller = intent === "seller";

  useEffect(() => {
    if (stage !== "otp") return;
    setResend(28);
    const id = setInterval(() => setResend(r => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const onOtp = () => setStage("name");
  const finish = () => { setAuthed?.(true); nav(isSeller ? "s-onboarding" : "home"); };

  return (
    <div style={{ minHeight: "calc(100vh - 110px)", background: "var(--page)", padding: "24px 28px" }}>
      <button onClick={() => stage === "phone" ? nav("splash") : setStage("phone")} style={{ background: "none", border: "none", color: "var(--ink-500)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".875rem" }}>
        <Icon name="chevronLeft" size={16} /> Back
      </button>

      <div style={{ maxWidth: 420, margin: "32px auto 0", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Logo height={48} /></div>

        {stage === "phone" && (
          <div style={{ marginTop: 28 }}>
            {isSeller && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--tint-red-50)", border: "1.5px solid var(--red)", borderRadius: 999, marginBottom: 14 }}>
                <Icon name="store" size={14} color="var(--red)" />
                <span style={{ color: "var(--red)", fontWeight: 800, fontSize: ".75rem", letterSpacing: ".06em", textTransform: "uppercase" }}>Seller signup</span>
              </div>
            )}
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
              {isSeller ? <>Open your shop on <span style={{ color: "var(--red)" }}>BazaarCo</span></> : "Sign in to BazaarCo"}
            </h1>
            <p style={{ color: "var(--ink-500)", margin: "6px 0 0" }}>
              {isSeller
                ? "Same phone signup — we'll set up your shop after."
                : "Continue with phone or Google. Pick whichever works for you."}
            </p>
            {isSeller && (
              <p className="ne" style={{ color: "var(--ink-500)", margin: "4px 0 0", fontSize: ".875rem" }}>आफ्नो पसल खोल्नुहोस्</p>
            )}

            <div style={{ marginTop: 28 }}>
              <button onClick={finish} style={{ width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                background: "#fff", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", cursor: "pointer", fontWeight: 700, fontSize: ".9375rem", color: "var(--ink-900)" }}>
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-11.3 8 12 12 0 1 1 7.9-21.1l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/>
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 24 36a12 12 0 0 1-11.3-8l-6.6 5A20 20 0 0 0 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3C37 39.3 44 34 44 24a20 20 0 0 0-.4-3.5z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
              <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>or</span>
              <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
            </div>

            <label style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>Phone number</label>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", overflow: "hidden", background: "#fff" }}>
              <span style={{ padding: "0 14px", height: 56, display: "flex", alignItems: "center", background: "var(--line-100)", color: "var(--ink-400)", fontWeight: 700, fontSize: "1rem" }}>+977</span>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="98XXXXXXXX"
                className="tnum" style={{ flex: 1, height: 56, border: "none", padding: "0 16px", fontSize: "1.125rem", fontFamily: "var(--font-sans)", outline: "none", fontWeight: 700, color: "var(--ink-900)" }} />
            </div>
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 8 }}>We will SMS a 4-digit code.</p>

            <div style={{ marginTop: 20 }}>
              <Button variant="primary" size="lg" full disabled={!phoneValid} onClick={() => setStage("otp")}>
                {isSeller ? "Get code · कोड पठाउनुहोस्" : "Get code · कोड पठाउनुहोस्"}
              </Button>
            </div>

            {/* Skip auth — continue to homepage as guest */}
            <div style={{ marginTop: 10 }}>
              <Button variant="ghost" full onClick={() => nav("home")}>
                Skip for now → शप गर्न जानुहोस्
              </Button>
            </div>

            {/* Intent switcher — link-style, sits below CTA */}
            <div style={{ marginTop: 22, padding: "16px 0 0", borderTop: "1px dashed var(--line-200)", textAlign: "center" }}>
              {!isSeller ? (
                <>
                  <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>Want to sell on BazaarCo?</div>
                  <button onClick={() => setIntent("seller")}
                    style={{ background: "none", border: "none", padding: "6px 0", marginTop: 2, cursor: "pointer", color: "var(--red)", fontWeight: 800, fontSize: ".9375rem", textDecoration: "underline", textUnderlineOffset: 4, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                    <Icon name="store" size={16} color="var(--red)" />
                    Become a seller · पसल खोल्नुहोस्
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>Just want to shop?</div>
                  <button onClick={() => setIntent("buyer")}
                    style={{ background: "none", border: "none", padding: "6px 0", marginTop: 2, cursor: "pointer", color: "var(--blue)", fontWeight: 800, fontSize: ".9375rem", textDecoration: "underline", textUnderlineOffset: 4, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                    <Icon name="cart" size={16} color="var(--blue)" />
                    Sign in as buyer instead
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {stage === "otp" && (
          <div style={{ marginTop: 36 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>Enter the code</h1>
            <p style={{ color: "var(--ink-500)", margin: "6px 0 0" }}>Sent to +977 {phone} · <button onClick={() => setStage("phone")} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit" }}>change</button></p>

            <div style={{ marginTop: 30 }}>
              <OTPInput length={4} onComplete={onOtp} />
            </div>

            <p style={{ fontSize: ".8125rem", color: "var(--ink-400)", marginTop: 18 }}>
              {resend > 0
                ? <>Resend in <span className="tnum">0:{String(resend).padStart(2, "0")}</span></>
                : <button onClick={() => setStage("otp")} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit" }}>Resend code</button>}
            </p>
          </div>
        )}

        {stage === "name" && (
          <div style={{ marginTop: 36 }}>
            {isSeller && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--tint-red-50)", border: "1.5px solid var(--red)", borderRadius: 999, marginBottom: 14 }}>
                <Icon name="store" size={14} color="var(--red)" />
                <span style={{ color: "var(--red)", fontWeight: 800, fontSize: ".75rem", letterSpacing: ".06em", textTransform: "uppercase" }}>Seller signup</span>
              </div>
            )}
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
              {isSeller ? "What's your name?" : "What should we call you?"}
            </h1>
            <p className="ne" style={{ color: "var(--ink-500)", margin: "6px 0 0" }}>तपाईंलाई के नामले बोलाउने?</p>

            <input value={name} onChange={e => setName(e.target.value)} placeholder="First name only" autoFocus
              style={{ width: "100%", height: 56, border: "1.5px solid var(--line-200)", borderRadius: "var(--r-md)", padding: "0 16px", fontSize: "1.125rem", marginTop: 30, fontFamily: "var(--font-sans)", outline: "none", textAlign: "center" }} />

            <div style={{ marginTop: 28 }}>
              <Button variant="primary" size="lg" full disabled={!name.trim()} onClick={finish}>
                {isSeller ? "Next: shop documents →" : "Welcome to BazaarCo →"}
              </Button>
            </div>
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 16 }}>
              {isSeller ? "Next we'll snap your PAN or NID — takes 1 minute." : "No email. No password. Just your phone."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
