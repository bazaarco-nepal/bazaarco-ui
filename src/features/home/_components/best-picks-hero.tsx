"use client";

import { Button } from "@/components/ui";
import { useBz } from "@/components/common";

/* Best Picks promo — BazaarCo brand-red theme.
   Replaces the old single sponsored placement. One shared design,
   two responsive renders so desktop and mobile stay in sync. */

// Top-rated product spotlight image (white-friendly camera shot).
const HERO_IMG =
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=720&q=80";

const RED_WASH = "linear-gradient(120deg, var(--tint-red-50) 0%, #ffe1e4 52%, #ffd0d5 100%)";

function Spotlight({ size, glow }: { size: number; glow: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* soft brand-red glow behind the product */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(230,57,70,.28), rgba(230,57,70,0) 70%)",
          filter: `blur(${glow}px)`,
        }}
      />
      <img
        src={HERO_IMG}
        alt="Top-rated product"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "var(--r-xl)",
          boxShadow: "0 18px 40px rgba(230,57,70,.22)",
        }}
      />
    </div>
  );
}

/* ---------- Desktop ---------- */
export function BestPicksHero() {
  const { nav } = useBz();
  return (
    <div
      className="bz-split-hero"
      style={{
        position: "relative",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        background: RED_WASH,
      }}
    >
      <div
        className="fade-up"
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          padding: "56px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 560,
        }}
      >
        <h1
          className="bz-hero-h1"
          style={{
            margin: 0,
            fontWeight: 800,
            color: "var(--ink-900)",
            letterSpacing: "-.02em",
          }}
        >
          Best Picks.
          <br />
          <span style={{ color: "var(--red)" }}>Best Prices.</span>
        </h1>
        <p
          style={{ color: "var(--ink-500)", fontSize: "1.0625rem", marginTop: 14, lineHeight: 1.5 }}
        >
          Discover top-rated products at amazing prices.
        </p>
        <div style={{ marginTop: 30 }}>
          <Button
            variant="primary"
            size="lg"
            style={{ borderRadius: "var(--r-full)" }}
            iconRight="arrowRight"
            onClick={() => nav("browse")}
          >
            Shop now
          </Button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 56px",
        }}
      >
        <Spotlight size={300} glow={26} />
      </div>
    </div>
  );
}

/* ---------- Mobile (compact band) ---------- */
export function BestPicksBanner() {
  const { nav } = useBz();
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        minHeight: 112,
        background: RED_WASH,
      }}
    >
      <div style={{ flex: 1, padding: "14px 0 14px 16px", minWidth: 0 }}>
        <div
          style={{
            fontSize: "1.1875rem",
            fontWeight: 800,
            color: "var(--ink-900)",
            lineHeight: 1.15,
            letterSpacing: "-.01em",
          }}
        >
          Best Picks.
          <br />
          <span style={{ color: "var(--red)" }}>Best Prices.</span>
        </div>
        <p
          style={{
            fontSize: ".8125rem",
            color: "var(--ink-500)",
            margin: "6px 0 10px",
            lineHeight: 1.38,
          }}
        >
          Top-rated products at amazing prices.
        </p>
        <Button
          variant="primary"
          size="sm"
          style={{ borderRadius: "var(--r-full)" }}
          iconRight="arrowRight"
          onClick={() => nav("browse")}
        >
          Shop now
        </Button>
      </div>
      <div style={{ flexShrink: 0, padding: "0 16px" }}>
        <Spotlight size={78} glow={12} />
      </div>
    </div>
  );
}
