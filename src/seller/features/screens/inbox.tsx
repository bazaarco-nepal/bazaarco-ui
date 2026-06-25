"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ChipGroup, usePages, PageBar, ApiState } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { useSellerInbox } from "@/seller/hooks/use-seller";
import { pathFromScreen } from "@/config/routes";
import {
  OrderCard,
  SellerHelpBar,
  SellerPageHeader,
  SelectMenu,
  SellerEmptyState,
  SellerPage,
} from "../_shared/components";
import {
  INBOX_DATE_RANGES,
  INBOX_TAB_STATUSES,
  SELLER_BOARD_COLUMNS,
  inboxLabel,
  inboxTone,
  inDateRange,
} from "../_shared/inbox";
import { sellerOrderRef } from "../_shared/refs";
import { type SellerInboxOrderItem } from "../_shared/types";

export function SellerInbox() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: INBOX_ORDERS = [], isLoading, isError, error } = useSellerInbox();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("list"); // list | kanban
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");

  const q = search.trim().toLowerCase();
  const baseFiltered = INBOX_ORDERS.filter((o: SellerInboxOrderItem) => {
    if (q && !`${o.id} ${o.buyer} ${o.item}`.toLowerCase().includes(q)) return false;
    if (!inDateRange(o, range)) return false;
    return true;
  });
  const counts: Record<string, number> = {
    all: baseFiltered.length,
    ...Object.fromEntries(
      Object.entries(INBOX_TAB_STATUSES).map(([id, statuses]) => [
        id,
        baseFiltered.filter((o) => statuses.includes(o.status)).length,
      ]),
    ),
  };
  const list = baseFiltered.filter(
    (o) => tab === "all" || (INBOX_TAB_STATUSES[tab]?.includes(o.status) ?? false),
  );
  const openOrder = (o: SellerInboxOrderItem) => {
    sellerOrderRef.current = o;
    router.push(pathFromScreen("s-order-detail", undefined, undefined, o.id), { scroll: false });
  };
  const filtersActive = search.trim() || range !== "all" || tab !== "all";
  const clearFilters = () => {
    setSearch("");
    setRange("all");
    setTab("all");
  };
  const ordersPaged = usePages(list, 8, `${tab}|${q}|${range}`);
  const boardOrders = tab === "all" ? baseFiltered : list;

  const tabs = [
    { id: "all", label: t("seller.inbox.tabAll") },
    { id: "new", label: t("seller.inbox.tabNew") },
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
              className="bz-hover-border"
              aria-pressed={view === "kanban"}
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
              label: `${t.label} (${counts[t.id] ?? 0})`,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {view === "kanban" ? (
          <div className="bz-seller-board" aria-label="Seller order fulfillment board">
            {SELLER_BOARD_COLUMNS.map((column) => {
              const sampleStatus = column.statuses[0] ?? "";
              const lbl = inboxLabel(sampleStatus);
              const tone = inboxTone(sampleStatus);
              const items = boardOrders.filter((o) => column.statuses.includes(o.status));
              return (
                <section key={column.id} className="bz-seller-board__column">
                  <div className="bz-seller-board__head">
                    <div style={{ minWidth: 0 }}>
                      <div className="bz-seller-board__title">
                        <SellerIcon
                          name={lbl.icon}
                          size={16}
                          color={`var(--${tone === "success" ? "success" : tone})`}
                        />
                        <span>{column.title}</span>
                      </div>
                      <div className="bz-seller-board__hint">{column.hint}</div>
                    </div>
                    <span className="bz-seller-board__count tnum">{items.length}</span>
                  </div>
                  <div className="bz-seller-board__cards">
                    {items.length === 0 && (
                      <div className="bz-seller-board__empty">No orders in this step</div>
                    )}
                    {items.map((o) => (
                      <OrderCard key={o.id} o={o} onOpen={openOrder} />
                    ))}
                  </div>
                </section>
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
