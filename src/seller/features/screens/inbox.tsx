"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChipGroup, usePages, PageBar, ApiState } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { type OrderStatus } from "@/shared/lib/order-utils";
import { useSellerInbox } from "@/seller/hooks/use-seller";
import { useBz } from "@/components/common";
import {
  OrderCard,
  SellerHelpBar,
  SellerPageHeader,
  SelectMenu,
  SellerEmptyState,
  SellerPage,
} from "../_shared/components";
import { INBOX_DATE_RANGES, INBOX_LABEL, INBOX_TONE, inDateRange } from "../_shared/inbox";
import { sellerOrderRef } from "../_shared/refs";
import { type SellerInboxOrderItem } from "../_shared/types";

export function SellerInbox() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const { data: INBOX_ORDERS = [], isLoading, isError, error } = useSellerInbox();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("list"); // list | kanban
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");

  const q = search.trim().toLowerCase();
  const baseFiltered = INBOX_ORDERS.filter((o: SellerInboxOrderItem) => {
    if (q && !`${o.id} ${o.buyer} ${o.city} ${o.item}`.toLowerCase().includes(q)) return false;
    if (!inDateRange(o, range)) return false;
    return true;
  });
  const counts = {
    all: baseFiltered.length,
    placed: baseFiltered.filter((o) => o.status === "placed").length,
    processing: baseFiltered.filter((o) =>
      ["accepted", "packaging_started", "ready_for_pickup"].includes(o.status),
    ).length,
    shipped: baseFiltered.filter((o) =>
      ["picked_up", "arrived_at_hub", "out_for_delivery"].includes(o.status),
    ).length,
    completed: baseFiltered.filter((o) => o.status === "delivered").length,
    cancelled: baseFiltered.filter((o) => o.status === "cancelled").length,
  };
  const list = baseFiltered.filter((o) => {
    if (tab === "all") return true;
    if (tab === "processing")
      return ["accepted", "packaging_started", "ready_for_pickup"].includes(o.status);
    if (tab === "shipped")
      return ["picked_up", "arrived_at_hub", "out_for_delivery"].includes(o.status);
    if (tab === "completed") return o.status === "delivered";
    return o.status === tab;
  });
  const openOrder = (o: SellerInboxOrderItem) => {
    sellerOrderRef.current = o;
    nav("s-order-detail");
  };
  const filtersActive = search.trim() || range !== "all" || tab !== "all";
  const clearFilters = () => {
    setSearch("");
    setRange("all");
    setTab("all");
  };
  const ordersPaged = usePages(list, 8, `${tab}|${q}|${range}`);

  const tabs = [
    { id: "all", label: t("seller.inbox.tabAll") },
    { id: "placed", label: t("seller.inbox.tabNew") },
    { id: "processing", label: t("seller.inbox.tabProcessing") },
    { id: "shipped", label: t("seller.inbox.tabShipped") },
    { id: "completed", label: t("seller.inbox.tabCompleted") },
    { id: "cancelled", label: t("seller.inbox.tabCancelled") },
  ];

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <SellerPage>
        <SellerHelpBar />

        <SellerPageHeader
          title={t("seller.inbox.title")}
          subtitle={t("seller.inbox.subtitle")}
          actions={
            <button
              onClick={() => setView((v) => (v === "list" ? "kanban" : "list"))}
              className="bz-mobile-hide bz-hover-border"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontWeight: 600,
                fontSize: ".8125rem",
                cursor: "pointer",
                color: "var(--ink-700)",
              }}
            >
              <SellerIcon name={view === "list" ? "kanban" : "layout"} size={16} />
              {view === "list" ? "Board view" : "List view"}
            </button>
          }
        />

        {/* Search + date range */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 240px", position: "relative", minWidth: 200 }}>
            <SellerIcon
              name="search"
              size={16}
              color="var(--ink-400)"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID, buyer, or item"
              aria-label="Search orders"
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
          <SelectMenu
            value={range}
            onChange={setRange}
            icon="clock"
            ariaLabel="Date range"
            options={INBOX_DATE_RANGES.map((r) => ({ value: r.id, label: r.label }))}
          />
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
              Clear
            </button>
          )}
        </div>

        {/* Status pills */}
        <div style={{ marginBottom: 16 }}>
          <ChipGroup
            options={tabs.map((t) => ({
              value: t.id,
              label: `${t.label} (${counts[t.id as keyof typeof counts]})`,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {view === "kanban" ? (
          <div className="bz-kanban">
            {[
              { id: "placed", statuses: ["placed"] },
              { id: "processing", statuses: ["accepted", "packaging_started", "ready_for_pickup"] },
              { id: "shipped", statuses: ["picked_up", "arrived_at_hub", "out_for_delivery"] },
              { id: "completed", statuses: ["delivered"] },
            ].map((col) => {
              const sampleStatus = col.statuses[0] as OrderStatus;
              const lbl =
                col.id === "processing"
                  ? { en: "Processing", icon: "package" }
                  : col.id === "shipped"
                    ? { en: "Shipped", icon: "truck" }
                    : INBOX_LABEL[sampleStatus];
              const tone = INBOX_TONE[sampleStatus];
              const items = baseFiltered.filter((o) => col.statuses.includes(o.status));
              return (
                <div
                  key={col.id}
                  style={{
                    background: "var(--line-100)",
                    borderRadius: "var(--r-lg)",
                    padding: 10,
                    minHeight: 200,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 6px 10px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        fontSize: ".875rem",
                        color: "var(--ink-900)",
                      }}
                    >
                      <SellerIcon
                        name={lbl.icon}
                        size={16}
                        color={`var(--${tone === "success" ? "success" : tone})`}
                      />
                      {lbl.en}
                    </span>
                    <span
                      className="tnum"
                      style={{
                        background: "#fff",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: ".7rem",
                        fontWeight: 600,
                      }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.length === 0 && (
                      <div
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: "var(--ink-400)",
                          fontSize: ".8125rem",
                        }}
                      >
                        None
                      </div>
                    )}
                    {items.map((o) => (
                      <OrderCard key={o.id} o={o} onOpen={openOrder} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.length === 0 && (
                <SellerEmptyState
                  icon="package"
                  title="No orders here yet"
                  message="Orders from buyers will appear here. Try clearing the filters if you expected to see some."
                />
              )}
              {ordersPaged.visible.map((o) => (
                <OrderCard key={o.id} o={o} onOpen={openOrder} />
              ))}
            </div>
            {list.length > 0 && (
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
                  page={ordersPaged.page}
                  pageCount={ordersPaged.pageCount}
                  onPage={ordersPaged.goPage}
                  alwaysShow
                />
                <div
                  className="tnum"
                  style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}
                >
                  Showing {ordersPaged.from}–{ordersPaged.to} of {ordersPaged.total} orders
                </div>
              </div>
            )}
          </>
        )}
      </SellerPage>
    </ApiState>
  );
}
