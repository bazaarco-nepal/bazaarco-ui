"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Placeholder, VideoPlayer, EmptyState, ApiState } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { formatNPR } from "@/shared/lib/money";
import { useProduct } from "@/shared/hooks/use-catalog";
import { type SellerInventoryItem } from "@/seller/api/seller";
import { useBz, Footer } from "@/components/common";
import { DetailTile, SellerHelpBar } from "../_shared/components";
import { editProductRef } from "../_shared/refs";

/* ---------- 4.4b Product View (read-only) ---------- */
export function SellerProductView({ item }: { item: SellerInventoryItem | null }) {
  const { t } = useTranslation();
  const { nav } = useBz();
  const { data: product, isLoading, isError, error } = useProduct(item?.id ?? null);

  if (!item) {
    return (
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px clamp(14px, 4vw, 28px) 100px",
        }}
      >
        <SellerHelpBar />
        <EmptyState
          icon="store"
          title={t("seller.productView.noProductTitle")}
          message={t("seller.productView.noProductMessage")}
          cta={t("seller.productView.backToProducts")}
          onCta={() => nav("s-products")}
        />
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px clamp(14px, 4vw, 28px) 100px",
        }}
      >
        <SellerHelpBar />

        {/* Back + actions header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => nav("s-products")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--blue)",
              fontWeight: 600,
              fontSize: ".875rem",
              padding: 0,
            }}
          >
            <SellerIcon name="chevronLeft" size={18} color="var(--blue)" />
            {t("seller.productView.backToProducts")}
          </button>
          <div style={{ flex: 1 }} />
          <Button
            variant="secondary"
            icon="edit"
            onClick={() => {
              editProductRef.current = item;
              nav("s-edit");
            }}
          >
            {t("seller.productView.edit")}
          </Button>
        </div>

        {(item.listingStatus === "frozen" || item.listingStatus === "pending_reinstatement") &&
          item.moderationFeedback && (
            <div
              role="alert"
              style={{
                marginBottom: 20,
                padding: "14px 16px",
                borderRadius: "var(--r-md)",
                border: `1.5px solid ${item.listingStatus === "frozen" ? "var(--red)" : "var(--saffron)"}`,
                background:
                  item.listingStatus === "frozen" ? "rgba(230,57,70,.06)" : "rgba(247,127,0,.06)",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: ".8125rem",
                  color: "var(--danger)",
                  marginBottom: 6,
                }}
              >
                {item.listingStatus === "frozen"
                  ? t("seller.productView.listingTakenDown")
                  : t("seller.productView.awaitingAdminReview")}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: ".875rem",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                }}
              >
                {item.moderationFeedback}
              </p>
              {item.listingStatus === "frozen" && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                  }}
                >
                  {t("seller.productView.frozenInstructions")}
                </p>
              )}
              {item.listingStatus === "pending_reinstatement" && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                  }}
                >
                  {t("seller.productView.pendingReviewNote")}
                </p>
              )}
            </div>
          )}

        {/* Product images */}
        {product && (product.images?.length || product.img) ? (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {(product.images ?? (product.img ? [product.img] : [])).map((src, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                    border: "1px solid var(--line-200)",
                    background: "var(--line-100)",
                  }}
                >
                  <img
                    src={src}
                    alt={t("seller.productView.photoAlt", { name: item.name, index: i + 1 })}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : item.img ? (
          <div style={{ marginBottom: 24 }}>
            <img
              src={item.img}
              alt={item.name}
              style={{
                width: "100%",
                maxWidth: 320,
                height: 240,
                objectFit: "cover",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line-200)",
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <Placeholder
              icon={item.icon}
              style={{ width: 120, height: 120 }}
              radius="var(--r-md)"
            />
          </div>
        )}

        {/* Title + price */}
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
            fontWeight: 600,
            color: "var(--ink-900)",
          }}
        >
          {product?.name ?? item.name}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <span
            className="tnum"
            style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--ink-900)" }}
          >
            {formatNPR(product?.price ?? item.price)}
          </span>
          {product?.original && product.original > product.price && (
            <span
              className="tnum"
              style={{
                fontSize: ".875rem",
                color: "var(--ink-400)",
                textDecoration: "line-through",
              }}
            >
              {formatNPR(product.original)}
            </span>
          )}
          {product?.discountPct && (
            <span
              style={{
                fontSize: ".8125rem",
                fontWeight: 600,
                color: "var(--success)",
                background: "color-mix(in srgb, var(--success) 8%, transparent)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {t("seller.productView.percentOff", { percent: product.discountPct })}
            </span>
          )}
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Stock */}
          <DetailTile
            label={t("seller.productView.stock")}
            value={String(item.stock)}
            tone={item.stock === 0 ? "danger" : item.stock <= 3 ? "saffron" : "success"}
            sub={
              item.stock === 0
                ? t("seller.productView.outOfStock")
                : item.stock <= 3
                  ? t("seller.productView.lowStock")
                  : t("seller.productView.inStock")
            }
          />
          {/* Rating */}
          {product && product.rating > 0 && (
            <DetailTile
              label={t("seller.productView.rating")}
              value={product.rating.toFixed(1)}
              sub={t("seller.productView.reviewCount", { count: product.reviews })}
            />
          )}
          {/* Bargaining — the floor is private to the seller, so it's read from
              the seller-only inventory row, not the public product. */}
          <DetailTile
            label={t("seller.productView.bargaining")}
            value={
              item?.allowBargaining
                ? t("seller.productView.enabled")
                : t("seller.productView.disabled")
            }
            sub={
              item?.minimumPrice
                ? t("seller.productView.minPrice", { price: formatNPR(item.minimumPrice) })
                : undefined
            }
          />
          {/* Category */}
          {product?.cat && (
            <DetailTile label={t("seller.productView.category")} value={product.cat} />
          )}
        </div>

        {/* Variants */}
        {product?.variants && product.variants.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: ".875rem",
                fontWeight: 600,
                color: "var(--ink-700)",
              }}
            >
              {t("seller.productView.options")}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {product.variants.map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 20px",
                    background: i === 0 ? "var(--blue-deep)" : "#fff",
                    color: i === 0 ? "#fff" : "var(--ink-900)",
                    border: `1.5px solid ${i === 0 ? "var(--blue-deep)" : "var(--line-200)"}`,
                    borderRadius: "var(--r-md)",
                    minHeight: 52,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: ".9375rem" }}>{v.name}</span>
                  <span
                    className="tnum"
                    style={{
                      fontWeight: 600,
                      fontSize: ".875rem",
                      opacity: i === 0 ? 0.85 : 1,
                      color: i === 0 ? "#fff" : "var(--ink-600)",
                    }}
                  >
                    {formatNPR(v.price)}
                  </span>
                </div>
              ))}
            </div>
            {/* Stock per variant */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {product.variants.map((v) => (
                <span
                  key={v.id}
                  className="tnum"
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background:
                      v.stock === 0
                        ? "rgba(220,38,38,.08)"
                        : v.stock <= 3
                          ? "rgba(247,127,0,.08)"
                          : "var(--line-100)",
                    color:
                      v.stock === 0
                        ? "var(--danger)"
                        : v.stock <= 3
                          ? "var(--saffron)"
                          : "var(--ink-500)",
                  }}
                >
                  {t("seller.productView.variantInStock", { name: v.name, count: v.stock })}
                </span>
              ))}
            </div>
            {/* Tracking codes — immutable backend-generated SKUs for operations. */}
            {product.variants.some((v) => v.platformSku) && (
              <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
                {product.variants.map((v) =>
                  v.platformSku ? (
                    <div
                      key={`sku-${v.id}`}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 10,
                        fontSize: ".75rem",
                        color: "var(--ink-500)",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{v.name}</span>
                      <code style={{ fontFamily: "monospace" }}>{v.platformSku}</code>
                      {v.sellerSku ? (
                        <span>· {t("seller.productView.yourCode", { code: v.sellerSku })}</span>
                      ) : null}
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {product?.description && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: ".875rem",
                fontWeight: 600,
                color: "var(--ink-700)",
              }}
            >
              {t("seller.productView.description")}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: ".875rem",
                color: "var(--ink-600)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {product.description}
            </p>
          </div>
        )}

        {/* Specifications */}
        {product?.metadata && Object.keys(product.metadata).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: ".875rem",
                fontWeight: 600,
                color: "var(--ink-700)",
              }}
            >
              {t("seller.productView.specifications")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(product.metadata).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "8px 12px",
                    background: "var(--line-100)",
                    borderRadius: "var(--r-sm)",
                    fontSize: ".8125rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--ink-600)", minWidth: 100 }}>
                    {key}
                  </span>
                  <span style={{ color: "var(--ink-800)" }}>{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {product?.hasVideo && product?.videoUrl && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: ".875rem",
                fontWeight: 600,
                color: "var(--ink-700)",
              }}
            >
              {t("seller.productView.productVideo")}
            </h3>
            <VideoPlayer
              src={product.videoUrl}
              thumb={product.videoThumb}
              publicId={product.videoPublicId}
            />
          </div>
        )}

        {/* Footer info */}
        {product?.createdAt && (
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 8 }}>
            {t("seller.productView.listedOn", {
              date: new Date(product.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            })}
          </div>
        )}
      </div>
    </ApiState>
  );
}
