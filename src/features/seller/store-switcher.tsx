"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { StoreAvatar, Button, LandmarkAddress } from "@/components/ui";
import { SellerIcon } from "./_shared/icons";
import { useBz } from "@/components/common";
import { useCreateSellerStore, useSwitchActiveStore } from "@/hooks/use-seller";
import type { SellerStoreSummary } from "@/services/api/seller-organization";
import { emptyStoreAddress, type StoreAddress } from "@/lib/store-address";
import { toast } from "@/lib/toast";

// Must stay in lockstep with the seller-shell breakpoint in tokens.css. Below this
// width the sidebar slides in as a transformed drawer, so the switcher panel renders
// as a portal'd bottom sheet instead of an anchored popover (a transformed ancestor
// turns position:fixed children into position:absolute, which would misplace the sheet).
const SELLER_MOBILE_QUERY = "(max-width: 900px)";

/**
 * Where the trigger chip is mounted. The panel content is identical across all three;
 * only the trigger's shape and the desktop popover anchor differ.
 */
export type StoreSwitcherVariant = "sidebar" | "sidebar-collapsed" | "mobilebar";

interface StoreSwitcherChipProps {
  variant: StoreSwitcherVariant;
  stores: SellerStoreSummary[];
  activeSellerId: string | null;
}

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(SELLER_MOBILE_QUERY);
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

/** Lock body scroll while a full-screen sheet/modal is open on small screens. */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    // Reserve the width the page scrollbar leaves behind once we hide overflow,
    // otherwise the content reflows sideways and the sticky top store bar visibly
    // jumps the moment the sheet opens.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [active]);
}

export function StoreSwitcherChip({ variant, stores, activeSellerId }: StoreSwitcherChipProps) {
  const { t } = useTranslation();
  const { nav } = useBz();
  const isMobile = useIsMobileViewport();

  const switchStore = useSwitchActiveStore();
  const createStore = useCreateSellerStore();

  const [panelOpen, setPanelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState<StoreAddress>(emptyStoreAddress);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const activeStore =
    stores.find((store) => store.sellerId === activeSellerId) ?? stores[0] ?? null;

  useBodyScrollLock((panelOpen && isMobile) || addOpen);

  // Desktop popover dismissal: click outside the wrapper closes it. The mobile sheet
  // closes via its own overlay, so this listener is scoped to the non-mobile case.
  useEffect(() => {
    if (!panelOpen || isMobile) return;
    const dismiss = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", dismiss);
    return () => document.removeEventListener("mousedown", dismiss);
  }, [panelOpen, isMobile]);

  useEffect(() => {
    if (!panelOpen && !addOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (addOpen) setAddOpen(false);
      else setPanelOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [panelOpen, addOpen]);

  const handleSwitch = (storeId: string) => {
    if (storeId === activeSellerId || switchStore.isPending) return;
    switchStore.mutate(storeId, {
      onSuccess: () => {
        setPanelOpen(false);
        toast.success(t("seller.storeSwitched"));
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : t("seller.storeSwitchFailed")),
    });
  };

  const openAddStore = () => {
    setPanelOpen(false);
    setNewName("");
    setNewStoreAddress(emptyStoreAddress());
    setAddOpen(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      toast.error(t("seller.storeNameTooShort"));
      return;
    }
    const city = newStoreAddress.city?.trim();
    if (!city) {
      toast.error(t("seller.storeCityRequired"));
      return;
    }
    try {
      await createStore.mutateAsync({
        shopName: name,
        storeAddress: {
          city,
          ...(newStoreAddress.area?.trim() ? { area: newStoreAddress.area.trim() } : {}),
          ...(newStoreAddress.landmark?.trim()
            ? { landmark: newStoreAddress.landmark.trim() }
            : {}),
          ...(newStoreAddress.lat != null ? { lat: newStoreAddress.lat } : {}),
          ...(newStoreAddress.lng != null ? { lng: newStoreAddress.lng } : {}),
        },
      });
      setAddOpen(false);
      setNewName("");
      setNewStoreAddress(emptyStoreAddress());
      toast.success(t("seller.storeCreatedKyc"));
      // A brand-new store starts unverified — send the seller straight to KYC so it
      // can start selling. Switching active store is handled server-side on create.
      nav("s-verification");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("seller.storeCreateFailed"));
    }
  };

  const panelBody = (
    <StoreSwitcherPanelBody
      stores={stores}
      activeSellerId={activeSellerId}
      switching={switchStore.isPending}
      onSwitch={handleSwitch}
      onAddStore={openAddStore}
    />
  );

  return (
    <div ref={wrapRef} className={"bz-store-switcher bz-store-switcher--" + variant}>
      <StoreSwitcherTrigger
        variant={variant}
        store={activeStore}
        expanded={panelOpen}
        onToggle={() => setPanelOpen((open) => !open)}
      />

      {panelOpen &&
        (isMobile ? (
          <StoreSheetPortal title={t("seller.yourStores")} onClose={() => setPanelOpen(false)}>
            {panelBody}
          </StoreSheetPortal>
        ) : (
          <div
            className="bz-store-pop"
            role="dialog"
            aria-label={t("seller.yourStores")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bz-store-pop-head">{t("seller.yourStores")}</div>
            {panelBody}
          </div>
        ))}

      {addOpen && (
        <AddStoreModalPortal
          name={newName}
          onName={setNewName}
          address={newStoreAddress}
          onAddress={setNewStoreAddress}
          pending={createStore.isPending}
          onCancel={() => !createStore.isPending && setAddOpen(false)}
          onCreate={() => void handleCreate()}
        />
      )}
    </div>
  );
}

/* ── Trigger chip (varies by mount point) ───────────────────────────────────── */

function StoreSwitcherTrigger({
  variant,
  store,
  expanded,
  onToggle,
}: {
  variant: StoreSwitcherVariant;
  store: SellerStoreSummary | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const name = store?.shopName?.trim() || "BazaarCo";
  const avatarSize = variant === "mobilebar" ? 28 : 34;

  if (variant === "sidebar-collapsed") {
    return (
      <button
        type="button"
        className="bz-store-chip bz-store-chip--collapsed"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={t("seller.switchStore")}
        title={name}
      >
        <StoreAvatar src={store?.logoUrl} name={name} size={avatarSize} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={"bz-store-chip bz-store-chip--" + variant}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={t("seller.switchStore")}
    >
      <StoreAvatar src={store?.logoUrl} name={name} size={avatarSize} />
      <span className="bz-store-chip-text">
        <span className="bz-store-chip-name" title={name}>
          {name}
        </span>
        {variant === "sidebar" && <span className="bz-store-chip-role">{t("seller.role")}</span>}
      </span>
      <SellerIcon name="chevronDown" size={14} color="var(--ink-500)" />
    </button>
  );
}

/* ── Shared panel body: store list + add action ─────────────────────────────── */

function StoreSwitcherPanelBody({
  stores,
  activeSellerId,
  switching,
  onSwitch,
  onAddStore,
}: {
  stores: SellerStoreSummary[];
  activeSellerId: string | null;
  switching: boolean;
  onSwitch: (storeId: string) => void;
  onAddStore: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="bz-store-list" role="listbox" aria-label={t("seller.yourStores")}>
        {stores.map((store) => {
          const isActive = store.sellerId === activeSellerId;
          return (
            <button
              key={store.sellerId}
              type="button"
              role="option"
              aria-selected={isActive}
              className={"bz-store-row" + (isActive ? " active" : "")}
              onClick={() => onSwitch(store.sellerId)}
              disabled={switching}
            >
              <StoreAvatar src={store.logoUrl} name={store.shopName} size={36} />
              <span className="bz-store-row-text">
                <span className="bz-store-row-name">{store.shopName}</span>
                <StoreStatusPill verified={store.verified} city={store.city} />
              </span>
              {isActive && <SellerIcon name="check" size={18} color="var(--blue)" />}
            </button>
          );
        })}
      </div>
      <button type="button" className="bz-store-add" onClick={onAddStore}>
        <SellerIcon name="plus" size={16} color="var(--blue)" />
        {t("seller.addStore")}
      </button>
    </>
  );
}

function StoreStatusPill({ verified, city }: { verified: boolean; city: string | null }) {
  const { t } = useTranslation();
  return (
    <span className="bz-store-row-meta">
      <span className={"bz-store-pill " + (verified ? "ok" : "warn")}>
        {verified ? t("seller.storeVerified") : t("seller.storeUnverified")}
      </span>
      {city && <span className="bz-store-row-city">{city}</span>}
    </span>
  );
}

/* ── Mobile bottom sheet (portal'd to escape the transformed sidebar) ────────── */

function StoreSheetPortal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    // The portal mounts on document.body, outside the seller shell's
    // data-skin="fluent" scope, so re-assert the skin here — otherwise the
    // token-driven controls inside fall back to the buyer theme.
    <div data-skin="fluent">
      <div className="bz-store-sheet-overlay" onClick={onClose} />
      <div className="bz-store-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="bz-store-sheet-handle" />
        <div className="bz-store-sheet-head">
          <span>{title}</span>
          <button type="button" onClick={onClose} aria-label={title} className="bz-hover-tint">
            <SellerIcon name="x" size={18} color="var(--ink-500)" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ── Add-store modal (portal'd so it never anchors to a transformed parent) ──── */

function AddStoreModalPortal({
  name,
  onName,
  address,
  onAddress,
  pending,
  onCancel,
  onCreate,
}: {
  name: string;
  onName: (value: string) => void;
  address: StoreAddress;
  onAddress: (value: StoreAddress) => void;
  pending: boolean;
  onCancel: () => void;
  onCreate: () => void;
}) {
  const { t } = useTranslation();
  if (typeof document === "undefined") return null;
  return createPortal(
    // Re-assert the Fluent skin: this portal mounts on document.body, outside the
    // seller shell scope, so its inputs and buttons would otherwise render with the
    // buyer theme instead of Fluent.
    <div
      data-skin="fluent"
      className="bz-store-modal-scrim"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div className="bz-store-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="bz-store-modal-title">{t("seller.addStore")}</h3>
        <label className="bz-store-field">
          <span className="bz-store-field-label">{t("seller.storeName")}</span>
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={256}
            autoFocus
            className="bz-store-field-input"
          />
        </label>
        <div className="bz-store-field">
          <span className="bz-store-field-label">{t("seller.storeAddress")}</span>
          <p className="bz-store-field-hint">{t("seller.storeAddressHint")}</p>
          <LandmarkAddress value={address} onChange={onAddress} />
        </div>
        <div className="bz-store-modal-actions">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={onCreate} disabled={pending}>
            {pending ? t("seller.creatingStore") : t("seller.createStore")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
