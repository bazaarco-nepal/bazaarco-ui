"use client";

import React from "react";
import { Icon, StoreAvatar, Button, AppLink } from "@/components/ui";
import { useBz } from "@/components/common";
import { buyerEventsApi } from "@/buyer/api/buyer-events";
import { pathFromScreen } from "@/config/routes";
import type { ProductSeller, SellerTrust } from "@/types";

type SellerCardProps = {
  sellerId: string;
  /** Inline snapshot from the product payload — used until the trust query resolves. */
  seller: ProductSeller | null;
  fromProductId?: string;
  trust?: SellerTrust;
  loading?: boolean;
  /** Drop the outer card chrome so it can sit inside another card (e.g. the buy box). */
  embedded?: boolean;
  /** Compact one-line strip (mobile PDP): avatar · name/trust · Chat only. */
  slim?: boolean;
};

/**
 * PDP seller card. Shows only what's genuinely known: verified badge, store
 * rating, computed orders/products-sold and positive-rating %. Sellers without
 * earned trust signals simply show their identity and actions. All figures come
 * from GET /catalog/sellers/:id/trust.
 */
export function SellerCard({
  sellerId,
  seller,
  fromProductId,
  trust,
  loading,
  embedded = false,
  slim = false,
}: SellerCardProps) {
  const { nav, authed, promptLogin } = useBz();

  const name = trust?.name ?? seller?.name ?? "Seller";
  // The store's logo (avatar). Use the first non-empty source so an empty string
  // from one doesn't suppress a real logo from the other.
  const avatar = (trust?.avatar || seller?.avatar || "").trim();
  const rating = trust?.rating ?? seller?.rating ?? 0;
  const storeHandle = trust?.slug || sellerId;
  const storeHref = pathFromScreen("store", storeHandle);

  const openChat = () => {
    if (!authed) {
      promptLogin("Please sign in to chat with this seller.");
      return;
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("bz_open_chat_seller", sellerId);
    }
    nav("messages");
  };

  const recordSellerOpen = () => {
    if (!authed) return;
    void buyerEventsApi
      .record({
        eventType: "seller_profile_opened",
        storeId: sellerId,
        sourcePage: "product_detail",
        sourceSection: "seller_info",
        metadata: fromProductId ? { from_product_id: fromProductId } : null,
      })
      .catch(() => undefined);
  };

  const stats = trust ? buildStats(trust) : [];

  if (slim) {
    // One-line strip for the mobile PDP. Only show an earned trust signal;
    // account-age labels such as "New seller" do not help a buying decision.
    const sub = stats[0];
    const subtitle = loading
      ? "Loading seller info…"
      : [trust?.verified ? "Verified" : "Seller", sub ? `${sub.value} ${sub.label}`.trim() : null]
          .filter(Boolean)
          .join(" · ");
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          // Break out of the page's 16px gutter so the divider spans edge-to-edge,
          // then re-pad 16px so the content lines up with every other block.
          margin: "0 -16px",
          padding: "13px 16px",
          borderTop: "1px solid var(--line-200)",
        }}
      >
        <AppLink
          href={storeHref}
          onClickCapture={recordSellerOpen}
          aria-label={`Visit ${name} store`}
          style={{ cursor: "pointer", display: "inline-flex", flex: "0 0 auto" }}
        >
          <StoreAvatar src={avatar || null} name={name} size={36} />
        </AppLink>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: ".8125rem",
              fontWeight: 600,
              color: "var(--ink-900)",
            }}
          >
            <AppLink
              href={storeHref}
              onClickCapture={recordSellerOpen}
              className="bz-hover-underline"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              {name}
            </AppLink>
            {trust?.verified && <Icon name="badgeCheck" size={13} color="var(--blue)" />}
          </div>
          <div
            style={{
              fontSize: ".6875rem",
              color: "var(--ink-500)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          aria-label={`Message ${name}`}
          onClick={openChat}
          style={{ flex: "0 0 auto" }}
        >
          Message
        </Button>
      </div>
    );
  }

  return (
    <div
      style={
        embedded
          ? {}
          : {
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 16,
              background: "var(--card)",
            }
      }
    >
      <div
        style={{
          fontSize: ".6875rem",
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--ink-400)",
          marginBottom: 10,
        }}
      >
        Sold by
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* The store's uploaded logo when set; otherwise the shared brand-mark
            monogram (store initial on a deterministic tint) — never a generic
            icon, so every seller reads as a real shop. */}
        <AppLink
          href={storeHref}
          onClickCapture={recordSellerOpen}
          aria-label={`Visit ${name} store`}
          style={{ cursor: "pointer", display: "inline-flex", flexShrink: 0 }}
        >
          <StoreAvatar src={avatar || null} name={name} size={44} />
        </AppLink>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
              color: "var(--ink-900)",
              fontSize: ".9375rem",
            }}
          >
            <AppLink
              href={storeHref}
              onClickCapture={recordSellerOpen}
              className="bz-hover-underline"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              {name}
            </AppLink>
            {trust?.verified && <Icon name="badgeCheck" size={15} color="var(--blue)" />}
          </div>
          <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>
            {loading ? "Loading seller info…" : trust?.verified ? "Verified Seller" : "Seller"}
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 16px",
            marginTop: 12,
            fontSize: ".8125rem",
            color: "var(--ink-600)",
          }}
        >
          {stats.map((s) => (
            <span key={s.label}>
              <strong style={{ color: "var(--ink-900)" }}>{s.value}</strong> {s.label}
            </span>
          ))}
        </div>
      )}

      {rating > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            fontSize: ".8125rem",
            color: "var(--ink-600)",
          }}
        >
          <Icon name="star" size={13} color="var(--gold)" fill="var(--gold)" />
          <span style={{ color: "var(--ink-900)", fontWeight: 700 }}>{rating.toFixed(1)}</span>
          <span>store rating</span>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Button
          variant="secondary"
          size="md"
          full
          icon="messageDots"
          aria-label={`Message ${name}`}
          onClick={openChat}
        >
          Message the seller
        </Button>
      </div>
    </div>
  );
}

function buildStats(trust: SellerTrust): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];

  if (trust.positiveRatingPct != null) {
    out.push({ value: `${trust.positiveRatingPct}%`, label: "positive" });
  }
  if (trust.ordersCompleted > 0) {
    out.push({ value: trust.ordersCompleted.toLocaleString(), label: "orders completed" });
  }
  if (trust.productsSold > 0) {
    out.push({ value: trust.productsSold.toLocaleString(), label: "items sold" });
  }

  return out;
}
