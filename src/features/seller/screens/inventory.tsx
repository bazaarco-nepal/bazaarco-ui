"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Chip,
  Price,
  Placeholder,
  ChipGroup,
  usePages,
  PageBar,
  ApiState,
} from "@/components/ui";
import { SellerIcon } from "../_shared/icons";
import { ProductDeleteConfirmModal } from "@/components/seller/product-delete-confirm-modal";
import { formatNPR } from "@/lib/money";
import { type CreateProductVariantPayload, type SellerInventoryItem } from "@/services/api/seller";
import {
  useUpdateProduct,
  useDeleteProduct,
  useSellerInventory,
  useAcknowledgeProductModeration,
} from "@/hooks/use-seller";
import { useBz } from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import { SellerHelpBar, SellerPageHeader, SellerEmptyState } from "../_shared/components";
import {
  useLocalDraft,
  ADD_PRODUCT_DRAFT_KEY,
  productDraftHasContent,
  type ProductDraftPreview,
} from "../_shared/form-workflow";
import { useIsNarrow } from "../_shared/hooks";
import { editProductRef, viewProductRef } from "../_shared/refs";
import { ConfirmModal } from "@/components/seller/confirm-modal";

/* ---------- 4.5 Inventory — swipe-to-sell ---------- */
const EMPTY_INVENTORY: SellerInventoryItem[] = [];

export function SellerInventory() {
  const { t } = useTranslation();
  const { nav, toast } = useBz();
  const { data: inventoryData = EMPTY_INVENTORY, isLoading, isError, error } = useSellerInventory();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const acknowledgeModeration = useAcknowledgeProductModeration();
  const [deleteTarget, setDeleteTarget] = useState<SellerInventoryItem | null>(null);
  const [items, setItems] = useState<SellerInventoryItem[]>([]);
  useEffect(() => {
    setItems(inventoryData);
  }, [inventoryData]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  // Pending (uncommitted) stock edits. Kept OUTSIDE `items` so the inventory
  // refetch triggered by every save (or window refocus) can't silently wipe an
  // in-progress edit. `stockDraft`: productId -> stock (single-SKU products).
  // `variantStockDraft`: productId -> { variantId -> stock }.
  const [stockDraft, setStockDraft] = useState<Record<string, number>>({});
  const [variantStockDraft, setVariantStockDraft] = useState<
    Record<string, Record<string, number>>
  >({});
  const [status, setStatus] = useState("all"); // all | active | low | oos
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("added");

  // The device-local "Add product" draft, surfaced here so a half-finished
  // listing is findable again (it autosaves but lives only in this browser).
  // Read in an effect to avoid an SSR/client hydration mismatch on localStorage.
  const productDraft = useLocalDraft<ProductDraftPreview>(ADD_PRODUCT_DRAFT_KEY);
  const [draftPreview, setDraftPreview] = useState<ProductDraftPreview | null>(null);
  useEffect(() => {
    const refresh = () => {
      const saved = productDraft.read();
      setDraftPreview(productDraftHasContent(saved) ? saved : null);
    };
    refresh();
    // Re-read when the seller comes back to this view (it may have stayed mounted
    // while they saved a draft on Add Product) or saved it in another tab.
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", refresh);
    };
    // `productDraft.read` is stable (keyed on a constant) — wire listeners once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const discardDraft = () => {
    productDraft.clear();
    setDraftPreview(null);
    setDiscardConfirmOpen(false);
    toast("Draft discarded");
  };
  // Keep the add-product action compact on phones so it stays inline with the
  // title instead of wrapping into an orphaned button above the search bar.
  const isMobile = useIsNarrow(768);

  // Effective (draft-aware) stock readers — what the seller currently sees.
  const effStock = useCallback(
    (it: SellerInventoryItem) => stockDraft[it.id] ?? it.stock,
    [stockDraft],
  );
  const effVariantStock = useCallback(
    (productId: string, v: CreateProductVariantPayload) =>
      variantStockDraft[productId]?.[v.id] ?? v.stock,
    [variantStockDraft],
  );
  // Server variant list overlaid with any local drafts (the payload to save).
  const effVariants = useCallback(
    (it: SellerInventoryItem): CreateProductVariantPayload[] =>
      (it.variants ?? []).map((v) => ({ ...v, stock: effVariantStock(it.id, v) })),
    [effVariantStock],
  );
  const stockDirty = useCallback(
    (it: SellerInventoryItem) => {
      if (it.hasVariants && it.variants?.length) {
        return it.variants.some((v) => effVariantStock(it.id, v) !== v.stock);
      }
      return effStock(it) !== it.stock;
    },
    [effStock, effVariantStock],
  );

  // Local-only edits (no backend call). The `+`/`−` steppers and the typed
  // input mutate the draft; nothing hits the API until Save.
  const adjustStock = (it: SellerInventoryItem, delta: number) => {
    if (savingId) return;
    const next = Math.max(0, effStock(it) + delta);
    setStockDraft((d) => ({ ...d, [it.id]: next }));
  };
  const typeStock = (it: SellerInventoryItem, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setStockDraft((d) => ({ ...d, [it.id]: digits === "" ? 0 : parseInt(digits, 10) }));
  };
  const adjustVariant = (
    it: SellerInventoryItem,
    v: CreateProductVariantPayload,
    delta: number,
  ) => {
    if (savingId) return;
    const next = Math.max(0, effVariantStock(it.id, v) + delta);
    setVariantStockDraft((d) => ({ ...d, [it.id]: { ...(d[it.id] ?? {}), [v.id]: next } }));
  };
  const typeVariant = (it: SellerInventoryItem, v: CreateProductVariantPayload, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const next = digits === "" ? 0 : parseInt(digits, 10);
    setVariantStockDraft((d) => ({ ...d, [it.id]: { ...(d[it.id] ?? {}), [v.id]: next } }));
  };

  const clearDraft = (id: string) => {
    setStockDraft((d) => {
      if (!(id in d)) return d;
      const next = { ...d };
      delete next[id];
      return next;
    });
    setVariantStockDraft((d) => {
      if (!(id in d)) return d;
      const next = { ...d };
      delete next[id];
      return next;
    });
  };

  // The single backend-touching path for stock: commits the final value in ONE
  // PATCH, optimistically updates the row, then clears the draft so the inventory
  // refetch reconciles cleanly. On failure the draft is kept for a retry.
  const commitStock = useCallback(
    async (
      id: string,
      payload: { stock: number } | { variants: CreateProductVariantPayload[] },
    ) => {
      const prev = items.find((i) => i.id === id);
      if (!prev || savingId) return;
      if ("stock" in payload && payload.stock === prev.stock) {
        clearDraft(id);
        return;
      }
      setSavingId(id);
      try {
        await updateProduct.mutateAsync({ id, ...payload });
        setItems((list) =>
          list.map((it) => {
            if (it.id !== id) return it;
            if ("variants" in payload) {
              const total = payload.variants.reduce((sum, v) => sum + v.stock, 0);
              return { ...it, stock: total, variants: payload.variants };
            }
            return { ...it, stock: payload.stock };
          }),
        );
        clearDraft(id);
        toast("Stock saved");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not update stock");
      } finally {
        setSavingId(null);
      }
    },
    [items, updateProduct, toast, savingId],
  );

  const saveStock = (it: SellerInventoryItem) => {
    if (it.hasVariants && it.variants?.length) {
      void commitStock(it.id, { variants: effVariants(it) });
    } else {
      void commitStock(it.id, { stock: effStock(it) });
    }
  };

  // "Sold one in shop" is a discrete real-world sale: commit −1 immediately
  // (folding in any pending draft) in a single call.
  const sellInShop = (it: SellerInventoryItem) => {
    if (savingId) return;
    const cur = effStock(it);
    if (cur <= 0) return;
    void commitStock(it.id, { stock: cur - 1 });
    toast("Sold one in shop · −1 stock");
  };
  const sellVariantInShop = (it: SellerInventoryItem, v: CreateProductVariantPayload) => {
    if (savingId) return;
    if (effVariantStock(it.id, v) <= 0) return;
    const variants = effVariants(it).map((x) => (x.id === v.id ? { ...x, stock: x.stock - 1 } : x));
    void commitStock(it.id, { variants });
    toast(`Sold one ${v.name} in shop`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteProduct.isPending) return;
    const { id, name } = deleteTarget;
    try {
      await deleteProduct.mutateAsync(id);
      // Drop it from the local optimistic list so the row disappears before the
      // inventory refetch lands.
      setItems((list) => list.filter((it) => it.id !== id));
      setExpanded((cur) => (cur === id ? null : cur));
      setDeleteTarget(null);
      toast(`${name} deleted`);
    } catch (err) {
      // 409 = product has order history (server keeps it to protect orders).
      // Keep the dialog open so the seller reads why and can cancel.
      toast(err instanceof Error ? err.message : "Could not delete this product");
    }
  };

  const savePrice = async (id: string) => {
    const it = items.find((i) => i.id === id);
    const raw = String(priceDraft[id] ?? it?.price ?? "").replace(/[^\d.]/g, "");
    const nextRupees = parseFloat(raw);
    if (!it || !Number.isFinite(nextRupees) || nextRupees <= 0) {
      toast("Enter a valid price (Rs.)");
      return;
    }
    if (nextRupees === it.price) return;
    setSavingId(id);
    try {
      // Prices are rupees end to end — send exactly what the seller typed.
      await updateProduct.mutateAsync({ id, price: nextRupees });
      setItems((list) => list.map((i) => (i.id === id ? { ...i, price: nextRupees } : i)));
      toast("Price saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update price");
    } finally {
      setSavingId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((cur) => {
      if (cur === id) return null;
      const it = items.find((i) => i.id === id);
      if (it) setPriceDraft((d) => ({ ...d, [id]: String(it.price) }));
      return id;
    });
  };

  const bucket = (it: SellerInventoryItem) => (it.stock === 0 ? "oos" : "active");
  const counts = {
    all: items.length,
    active: items.filter((it) => bucket(it) === "active").length,
    oos: items.filter((it) => bucket(it) === "oos").length,
  };
  const statusTabs = [
    { id: "all", label: t("seller.products.filterAll"), tone: "ink" },
    { id: "active", label: t("seller.products.filterActive"), tone: "success" },
    { id: "oos", label: t("seller.products.filterOos"), tone: "danger" },
  ];
  const sortOptions = useMemo(
    () => [
      { value: "added", label: t("seller.products.sortAdded") },
      { value: "stockLow", label: t("seller.products.sortStockLow") },
      { value: "priceLow", label: t("seller.products.sortPriceLow") },
      { value: "name", label: t("seller.products.sortName") },
    ],
    [t],
  );

  let visible = items.filter((it) => status === "all" || bucket(it) === status);
  if (search.trim()) {
    const q = search.toLowerCase();
    visible = visible.filter((it) => it.name.toLowerCase().includes(q));
  }
  if (sort === "stockLow") visible = [...visible].sort((a, b) => a.stock - b.stock);
  else if (sort === "priceLow") visible = [...visible].sort((a, b) => a.price - b.price);
  else if (sort === "name") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));

  const filtersActive = status !== "all" || search.trim() || sort !== "added";
  const clearFilters = () => {
    setStatus("all");
    setSearch("");
    setSort("added");
  };
  const invPaged = usePages(visible, 8, `${status}|${search}|${sort}`);

  return (
    <>
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

          <SellerPageHeader
            title={t("seller.products.title")}
            subtitle={t("seller.products.subtitle")}
            actions={
              <Button
                variant="primary"
                size="sm"
                icon="plus"
                href={pathFromScreen("s-add")}
                style={{ flexShrink: 0 }}
              >
                {isMobile ? t("seller.products.addShort") : t("seller.products.addProduct")}
              </Button>
            }
          />

          {draftPreview && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 14,
                marginBottom: 14,
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--line-200)",
                borderInlineStart: "3px solid var(--blue)",
                background: "var(--card, #fff)",
                boxShadow: "var(--sh-1)",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: "var(--r-md)",
                  background: "var(--tint-blue-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SellerIcon name="edit" size={20} color="var(--blue)" />
              </div>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <Chip tone="blue" size="sm">
                  Draft
                </Chip>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {draftPreview.title?.trim() || "Untitled product"}
                </div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>
                  {Number(draftPreview.price) > 0
                    ? `${formatNPR(Number(draftPreview.price))} · Not published yet`
                    : "Not published yet"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="primary" size="sm" icon="arrowRight" onClick={() => nav("s-add")}>
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={() => setDiscardConfirmOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: ".8125rem",
                    fontWeight: 600,
                    color: "var(--danger)",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Search + sort row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px", position: "relative", minWidth: 200 }}>
              <SellerIcon
                name="search"
                size={16}
                color="var(--ink-400)"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name"
                aria-label="Search products"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  height: 40,
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".875rem",
                  background: "#fff",
                  color: "var(--ink-900)",
                  outline: "none",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="bz-hover-tint"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 24,
                    borderRadius: "var(--r-full)",
                    border: "none",
                    background: "var(--line-200)",
                    color: "var(--ink-700)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SellerIcon name="x" size={12} color="var(--ink-700)" />
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                height: 40,
                padding: "0 12px",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                background: "#fff",
                color: "var(--ink-900)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
            {filtersActive && (
              <button
                onClick={clearFilters}
                style={{
                  height: 40,
                  padding: "0 14px",
                  border: "none",
                  background: "none",
                  color: "var(--ink-500)",
                  fontWeight: 600,
                  fontSize: ".8125rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Status pills */}
          <div style={{ marginBottom: 16 }}>
            <ChipGroup
              options={statusTabs.map((t) => ({
                value: t.id,
                label: `${t.label} (${counts[t.id as keyof typeof counts]})`,
              }))}
              value={status}
              onChange={setStatus}
            />
          </div>

          {visible.length === 0 ? (
            <SellerEmptyState
              icon="package"
              title="No products match"
              message="Try clearing the search or status filter."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {invPaged.visible.map((it) => {
                  const low = it.stock <= 3 && it.stock > 0;
                  const oos = it.stock === 0;
                  const isOpen = expanded === it.id;
                  const modStatus = it.listingStatus ?? "active";
                  const isFrozen = modStatus === "frozen";
                  const pendingReview = modStatus === "pending_reinstatement";
                  const modBorder = isFrozen
                    ? "var(--red)"
                    : pendingReview
                      ? "var(--saffron)"
                      : low
                        ? "var(--saffron)"
                        : "var(--line-200)";
                  return (
                    <div
                      key={it.id}
                      style={{
                        background: isFrozen
                          ? "rgba(230,57,70,.04)"
                          : pendingReview
                            ? "rgba(247,127,0,.06)"
                            : oos
                              ? "var(--line-100)"
                              : low
                                ? "rgba(247,127,0,.08)"
                                : "#fff",
                        border: `1.5px solid ${modBorder}`,
                        borderRadius: "var(--r-lg)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpanded(it.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          padding: 14,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {it.img ? (
                          <img
                            src={it.img}
                            alt=""
                            style={{
                              width: 72,
                              height: 72,
                              flexShrink: 0,
                              borderRadius: "var(--r-md)",
                              objectFit: "cover",
                              border: "1px solid var(--line-200)",
                              background: "var(--line-100)",
                            }}
                          />
                        ) : (
                          <Placeholder
                            icon={it.icon}
                            tint={it.tint}
                            style={{ width: 72, height: 72, flexShrink: 0 }}
                            radius="var(--r-md)"
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "1rem" }}>{it.name}</div>
                          {(isFrozen || pendingReview) && (
                            <div style={{ marginTop: 4 }}>
                              <Chip tone={isFrozen ? "red" : "saffron"} size="sm">
                                {isFrozen ? "Taken down" : "Awaiting review"}
                              </Chip>
                            </div>
                          )}
                          <div
                            className="tnum"
                            style={{
                              fontSize: ".875rem",
                              color: "var(--ink-900)",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {formatNPR(it.price)}
                          </div>
                          <div
                            style={{
                              fontSize: ".8125rem",
                              color: oos
                                ? "var(--danger)"
                                : low
                                  ? "var(--saffron)"
                                  : "var(--ink-500)",
                              marginTop: 2,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {oos ? (
                              <>
                                <SellerIcon name="zap" size={14} color="var(--danger)" /> Out of
                                stock
                              </>
                            ) : low ? (
                              <>
                                <SellerIcon name="zap" size={14} color="var(--saffron)" /> Only{" "}
                                {it.stock} left
                              </>
                            ) : (
                              <>Stock: {it.stock}</>
                            )}
                          </div>
                        </div>
                        <SellerIcon
                          name={isOpen ? "chevronDown" : "chevronRight"}
                          size={22}
                          color="var(--ink-400)"
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0 14px 14px",
                            borderTop: "1px dashed var(--line-200)",
                          }}
                        >
                          {(isFrozen || pendingReview) && it.moderationFeedback && (
                            <div
                              style={{
                                marginTop: 14,
                                padding: 12,
                                borderRadius: "var(--r-md)",
                                background: isFrozen
                                  ? "rgba(230,57,70,.08)"
                                  : "rgba(247,127,0,.08)",
                                border: `1px solid ${isFrozen ? "rgba(230,57,70,.25)" : "rgba(247,127,0,.3)"}`,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: ".8125rem",
                                  color: "var(--ink-900)",
                                  marginBottom: 6,
                                }}
                              >
                                Admin feedback
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: ".875rem",
                                  color: "var(--ink-700)",
                                  lineHeight: 1.5,
                                }}
                              >
                                {it.moderationFeedback}
                              </p>
                              {isFrozen && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  style={{ marginTop: 10 }}
                                  loading={acknowledgeModeration.isPending}
                                  onClick={() => {
                                    acknowledgeModeration.mutate(it.id, {
                                      onSuccess: () => {
                                        setItems((list) =>
                                          list.map((row) =>
                                            row.id === it.id
                                              ? {
                                                  ...row,
                                                  listingStatus: "pending_reinstatement",
                                                  sellerAcknowledgedAt: new Date().toISOString(),
                                                }
                                              : row,
                                          ),
                                        );
                                        toast(
                                          "Thanks — we'll review your fixes and restore the listing soon.",
                                          "success",
                                        );
                                      },
                                      onError: (err) => {
                                        toast(
                                          err instanceof Error
                                            ? err.message
                                            : "Could not submit. Try again.",
                                          "error",
                                        );
                                      },
                                    });
                                  }}
                                >
                                  I&apos;ve fixed this — submit for review
                                </Button>
                              )}
                              {pendingReview && (
                                <p
                                  style={{
                                    margin: "10px 0 0",
                                    fontSize: ".8125rem",
                                    color: "var(--ink-500)",
                                  }}
                                >
                                  Submitted for review. You&apos;ll be notified when the listing is
                                  live again.
                                </p>
                              )}
                            </div>
                          )}
                          {it.hasVariants && it.variants?.length ? (
                            <>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: ".875rem",
                                  margin: "14px 0 10px",
                                }}
                              >
                                Stock by variant
                                {savingId === it.id && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: ".75rem",
                                      color: "var(--ink-400)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Saving…
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {it.variants.map((v) => {
                                  const vStock = effVariantStock(it.id, v);
                                  const vLow = vStock <= 3 && vStock > 0;
                                  const vOos = vStock === 0;
                                  return (
                                    <div
                                      key={v.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 10px",
                                        border: `1.5px solid ${vLow ? "var(--saffron)" : "var(--line-200)"}`,
                                        borderRadius: "var(--r-md)",
                                        background: vOos ? "var(--line-50)" : "#fff",
                                      }}
                                    >
                                      <span
                                        style={{ flex: 1, fontWeight: 600, fontSize: ".875rem" }}
                                      >
                                        {v.name}
                                        {vOos && (
                                          <span
                                            style={{
                                              color: "var(--danger)",
                                              marginLeft: 6,
                                              fontSize: ".75rem",
                                            }}
                                          >
                                            Out
                                          </span>
                                        )}
                                        {vLow && !vOos && (
                                          <span
                                            style={{
                                              color: "var(--saffron)",
                                              marginLeft: 6,
                                              fontSize: ".75rem",
                                            }}
                                          >
                                            Low
                                          </span>
                                        )}
                                      </span>
                                      <div
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          border: "1px solid var(--line-200)",
                                          borderRadius: "var(--r-md)",
                                          overflow: "hidden",
                                          background: "#fff",
                                          opacity: savingId === it.id ? 0.6 : 1,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            adjustVariant(it, v, -1);
                                          }}
                                          disabled={vStock === 0 || savingId === it.id}
                                          style={{
                                            width: 36,
                                            height: 40,
                                            background: "#fff",
                                            border: "none",
                                            cursor:
                                              vStock === 0 || savingId === it.id
                                                ? "not-allowed"
                                                : "pointer",
                                            color: "var(--ink-700)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <SellerIcon name="minus" size={14} />
                                        </button>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          aria-label={`${v.name} stock`}
                                          value={String(vStock)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => typeVariant(it, v, e.target.value)}
                                          disabled={savingId === it.id}
                                          className="tnum"
                                          style={{
                                            width: 44,
                                            height: 40,
                                            textAlign: "center",
                                            fontWeight: 600,
                                            fontSize: ".9375rem",
                                            border: "none",
                                            outline: "none",
                                            background: "transparent",
                                            color: "var(--ink-700)",
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            adjustVariant(it, v, 1);
                                          }}
                                          disabled={savingId === it.id}
                                          style={{
                                            width: 36,
                                            height: 40,
                                            background: "#fff",
                                            border: "none",
                                            cursor: savingId === it.id ? "not-allowed" : "pointer",
                                            color: "var(--ink-700)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <SellerIcon name="plus" size={14} />
                                        </button>
                                      </div>
                                      {!vOos && (
                                        <button
                                          type="button"
                                          disabled={savingId === it.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            sellVariantInShop(it, v);
                                          }}
                                          style={{
                                            height: 32,
                                            padding: "0 10px",
                                            borderRadius: "var(--r-md)",
                                            border: "1px solid var(--line-200)",
                                            background: "#fff",
                                            color: "var(--ink-600)",
                                            fontSize: ".75rem",
                                            fontWeight: 600,
                                            cursor: savingId === it.id ? "not-allowed" : "pointer",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          −1 shop
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div
                                className="tnum"
                                style={{
                                  fontSize: ".8125rem",
                                  color: "var(--ink-500)",
                                  marginTop: 8,
                                  fontWeight: 600,
                                }}
                              >
                                Total: {effVariants(it).reduce((sum, v) => sum + v.stock, 0)} units
                              </div>
                              {stockDirty(it) && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    loading={savingId === it.id}
                                    disabled={savingId === it.id}
                                    onClick={() => saveStock(it)}
                                  >
                                    Save stock
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={savingId === it.id}
                                    onClick={() => clearDraft(it.id)}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "14px 0",
                                  gap: 12,
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ fontWeight: 600, fontSize: ".875rem" }}>
                                  Change stock
                                  {savingId === it.id && (
                                    <span
                                      style={{
                                        marginLeft: 8,
                                        fontSize: ".75rem",
                                        color: "var(--ink-400)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Saving…
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    border: "1px solid var(--line-200)",
                                    borderRadius: "var(--r-md)",
                                    overflow: "hidden",
                                    background: "#fff",
                                    opacity: savingId === it.id ? 0.6 : 1,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adjustStock(it, -1);
                                    }}
                                    disabled={effStock(it) === 0 || savingId === it.id}
                                    style={{
                                      width: 44,
                                      height: 48,
                                      background: "#fff",
                                      border: "none",
                                      cursor:
                                        effStock(it) === 0 || savingId === it.id
                                          ? "not-allowed"
                                          : "pointer",
                                      color: "var(--ink-700)",
                                    }}
                                  >
                                    <SellerIcon name="minus" size={18} />
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label="Stock"
                                    value={String(effStock(it))}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => typeStock(it, e.target.value)}
                                    disabled={savingId === it.id}
                                    className="tnum"
                                    style={{
                                      width: 56,
                                      height: 48,
                                      textAlign: "center",
                                      fontWeight: 600,
                                      fontSize: "1.125rem",
                                      border: "none",
                                      outline: "none",
                                      background: "transparent",
                                      color: "var(--ink-700)",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adjustStock(it, 1);
                                    }}
                                    disabled={savingId === it.id}
                                    style={{
                                      width: 44,
                                      height: 48,
                                      background: "#fff",
                                      border: "none",
                                      cursor: savingId === it.id ? "not-allowed" : "pointer",
                                      color: "var(--ink-700)",
                                    }}
                                  >
                                    <SellerIcon name="plus" size={18} />
                                  </button>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {stockDirty(it) && (
                                  <>
                                    <Button
                                      variant="primary"
                                      loading={savingId === it.id}
                                      disabled={savingId === it.id}
                                      onClick={() => saveStock(it)}
                                      icon="check"
                                    >
                                      Save stock
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      disabled={savingId === it.id}
                                      onClick={() => clearDraft(it.id)}
                                    >
                                      Reset
                                    </Button>
                                  </>
                                )}
                                {effStock(it) > 0 && (
                                  <Button
                                    variant="secondary"
                                    disabled={savingId === it.id}
                                    onClick={() => sellInShop(it)}
                                    icon="store"
                                  >
                                    Sold one in shop (−1)
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                          <div style={{ marginTop: 14 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: ".875rem",
                                marginBottom: 8,
                              }}
                            >
                              Price (Rs.)
                            </div>
                            {it.hasVariants ? (
                              <div
                                style={{
                                  fontSize: ".8125rem",
                                  color: "var(--ink-400)",
                                  padding: "10px 0",
                                }}
                              >
                                Price is set per variant — use{" "}
                                <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>
                                  Edit
                                </span>{" "}
                                below to update variant prices.
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={priceDraft[it.id] ?? String(it.price)}
                                  onChange={(e) =>
                                    setPriceDraft((d) => ({
                                      ...d,
                                      [it.id]: e.target.value.replace(/[^\d.]/g, ""),
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") void savePrice(it.id);
                                  }}
                                  disabled={savingId === it.id}
                                  className="tnum"
                                  style={{
                                    flex: "1 1 140px",
                                    minWidth: 120,
                                    height: 48,
                                    padding: "0 12px",
                                    border: "1px solid var(--line-200)",
                                    borderRadius: "var(--r-md)",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    outline: "none",
                                  }}
                                />
                                <Button
                                  variant="primary"
                                  disabled={savingId === it.id}
                                  onClick={() => void savePrice(it.id)}
                                >
                                  Save price
                                </Button>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              marginTop: 14,
                              borderTop: "1px dashed var(--line-200)",
                              paddingTop: 14,
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              variant="secondary"
                              icon="eye"
                              disabled={savingId === it.id}
                              onClick={() => {
                                viewProductRef.current = it;
                                nav("s-product-view");
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              icon="edit"
                              disabled={savingId === it.id}
                              onClick={() => {
                                editProductRef.current = it;
                                nav("s-edit");
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              icon="trash"
                              disabled={savingId === it.id}
                              onClick={() => setDeleteTarget(it)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <PageBar
                  page={invPaged.page}
                  pageCount={invPaged.pageCount}
                  onPage={invPaged.goPage}
                  alwaysShow
                />
                <div
                  className="tnum"
                  style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}
                >
                  Showing {invPaged.from}–{invPaged.to} of {invPaged.total} products
                </div>
              </div>
            </>
          )}
        </div>
      </ApiState>
      <ProductDeleteConfirmModal
        open={deleteTarget !== null}
        pending={deleteProduct.isPending}
        productName={deleteTarget?.name ?? ""}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        open={discardConfirmOpen}
        title="Discard this draft?"
        message="Your unsaved product listing will be permanently deleted. This cannot be undone."
        confirmLabel="Discard draft"
        cancelLabel="Keep editing"
        onConfirm={discardDraft}
        onCancel={() => setDiscardConfirmOpen(false)}
      />
    </>
  );
}
