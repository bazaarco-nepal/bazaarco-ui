"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Logo, Button, LandmarkAddress, ApiState, AppLink, StoreAvatar } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import {
  useSellerStorefront,
  useUpdateStorefront,
  useUploadStorefrontBanner,
  useUploadStorefrontLogo,
  useRemoveStorefrontLogo,
} from "@/seller/hooks/use-seller";
import { ImageCropModal } from "@/components/common/image-crop-modal";
import { pathFromScreen } from "@/config/routes";
import { toast } from "@/shared/lib/toast";
import { ApiRequestError } from "@/shared/api/http";
import { emptyStoreAddress, formatStoreAddress, type StoreAddress } from "@/shared/lib/store-address";
import { SellerHelpBar, SellerPageHeader, Card, Field } from "../_shared/components";
import { useIsNarrow } from "../_shared/hooks";

/* ---------- 4.11 Storefront builder ---------- */
export function SellerStorefront() {
  const { t } = useTranslation();
  const { data: storefront, isLoading, isError, error } = useSellerStorefront();
  const updateStorefront = useUpdateStorefront();
  const uploadLogo = useUploadStorefrontLogo();
  const removeLogo = useRemoveStorefrontLogo();
  const uploadBanner = useUploadStorefrontBanner();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoCropUrl, setLogoCropUrl] = useState<string | null>(null);
  const [bannerCropUrl, setBannerCropUrl] = useState<string | null>(null);
  const [about, setAbout] = useState("");
  const [shopName, setShopName] = useState("");
  const [storeAddress, setStoreAddress] = useState<StoreAddress>(emptyStoreAddress);

  useEffect(() => {
    if (!storefront) return;
    setAbout(storefront.about ?? "");
    setShopName(storefront.shopName ?? "");
    setStoreAddress(
      storefront.storeAddress ?? {
        city: storefront.city ?? "",
        area: "",
        landmark: "",
        lat: null,
        lng: null,
      },
    );
  }, [storefront]);

  const logoUrl = storefront?.logoUrl;
  const bannerUrl = storefront?.bannerUrl;
  const busy =
    updateStorefront.isPending ||
    uploadLogo.isPending ||
    removeLogo.isPending ||
    uploadBanner.isPending;
  // Below this width the two form columns stack; above it, store info takes one
  // column and the wider address + map column takes two.
  const narrow = useIsNarrow(860);
  // At/below the bottom-nav breakpoint we move Publish into a sticky save bar
  // pinned above the nav; above it the inline header button is the right home.
  const isMobile = useIsNarrow(768);

  // "Unsaved changes" tracks only the fields Publish actually saves: store name,
  // location, and about. Logo and banner upload on their own and are intentionally
  // excluded, so swapping them never marks the storefront as dirty.
  const isDirty = useMemo(() => {
    if (!storefront) return false;
    const savedAddress =
      storefront.storeAddress ??
      ({
        city: storefront.city ?? "",
        area: "",
        landmark: "",
        lat: null,
        lng: null,
      } as StoreAddress);
    const addressChanged =
      (storeAddress.city ?? "") !== (savedAddress.city ?? "") ||
      (storeAddress.area ?? "") !== (savedAddress.area ?? "") ||
      (storeAddress.landmark ?? "") !== (savedAddress.landmark ?? "") ||
      (storeAddress.lat ?? null) !== (savedAddress.lat ?? null) ||
      (storeAddress.lng ?? null) !== (savedAddress.lng ?? null);
    return (
      shopName !== (storefront.shopName ?? "") ||
      about !== (storefront.about ?? "") ||
      addressChanged
    );
  }, [storefront, shopName, about, storeAddress]);

  const handleRemoveLogo = async () => {
    try {
      await removeLogo.mutateAsync();
      toast.success("Logo removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove logo");
    }
  };

  const revokeObjectUrl = (url: string | null) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const pickImage = (file: File, kind: "logo" | "banner") => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Use JPEG, PNG, or WebP");
      return;
    }
    if (kind === "logo") {
      revokeObjectUrl(logoCropUrl);
      setLogoCropUrl(URL.createObjectURL(file));
    } else {
      revokeObjectUrl(bannerCropUrl);
      setBannerCropUrl(URL.createObjectURL(file));
    }
  };

  const closeLogoCrop = () => {
    revokeObjectUrl(logoCropUrl);
    setLogoCropUrl(null);
  };

  const saveLogoCrop = async (file: File) => {
    closeLogoCrop();
    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Logo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const closeBannerCrop = () => {
    revokeObjectUrl(bannerCropUrl);
    setBannerCropUrl(null);
  };

  const saveBannerCrop = async (file: File) => {
    closeBannerCrop();
    try {
      await uploadBanner.mutateAsync(file);
      toast.success("Banner updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const publish = async () => {
    const trimmedName = shopName.trim();
    if (trimmedName.length < 2) {
      toast.error("Store name is required");
      return;
    }
    const city = storeAddress.city?.trim();
    if (!city) {
      toast.error("Store address is required");
      return;
    }
    try {
      await updateStorefront.mutateAsync({
        about,
        shopName: trimmedName,
        storeAddress: {
          city,
          ...(storeAddress.area?.trim() ? { area: storeAddress.area.trim() } : {}),
          ...(storeAddress.landmark?.trim() ? { landmark: storeAddress.landmark.trim() } : {}),
          ...(storeAddress.lat != null ? { lat: storeAddress.lat } : {}),
          ...(storeAddress.lng != null ? { lng: storeAddress.lng } : {}),
        },
      });
      toast.success("Storefront published — buyers see it now");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save storefront");
    }
  };

  const isSetupRequired =
    isError && error instanceof ApiRequestError && error.errors.includes("SELLER_SETUP_REQUIRED");

  if (isSetupRequired) {
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            minHeight: 320,
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--brand-50, #fef3c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🏪
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--ink-900)",
            }}
          >
            Set up your shop first
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: ".9375rem",
              color: "var(--ink-500)",
              maxWidth: 380,
              lineHeight: 1.5,
            }}
          >
            Complete seller onboarding to register your organisation before you can customise your
            storefront.
          </p>
          <AppLink
            href={pathFromScreen("s-onboarding")}
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "10px 24px",
              background: "var(--brand)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              fontWeight: 600,
              fontSize: ".9375rem",
              textDecoration: "none",
            }}
          >
            Go to onboarding
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      {logoCropUrl ? (
        <ImageCropModal
          objectUrl={logoCropUrl}
          aspectRatio={1}
          outputWidth={512}
          outputHeight={512}
          maskShape="circle"
          showBrightness={false}
          title="Crop shop logo"
          subtitle="Drag and zoom to fit your logo inside the circle"
          confirmLabel="Save logo"
          fileNamePrefix="shop-logo"
          onCancel={closeLogoCrop}
          onConfirm={(file) => void saveLogoCrop(file)}
        />
      ) : null}
      {bannerCropUrl ? (
        <ImageCropModal
          objectUrl={bannerCropUrl}
          aspectRatio={3}
          outputWidth={1500}
          outputHeight={500}
          maskShape="rect"
          showBrightness
          title="Crop shop banner"
          subtitle="Drag to position · zoom to fill the frame"
          confirmLabel="Save banner"
          fileNamePrefix="shop-banner"
          onCancel={closeBannerCrop}
          onConfirm={(file) => void saveBannerCrop(file)}
        />
      ) : null}
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          // Reserve room for the sticky save bar so it never covers the last card.
          padding: `20px clamp(14px, 4vw, 28px) ${isMobile && isDirty ? 172 : 100}px`,
        }}
      >
        <SellerHelpBar />
        <SellerPageHeader
          title={t("seller.storefront.title")}
          subtitle={t("seller.storefront.subtitle")}
          actions={
            !isMobile && (
              <Button variant="primary" disabled={busy || !isDirty} onClick={() => void publish()}>
                {updateStorefront.isPending ? "Publishing…" : "Publish changes"}
              </Button>
            )
          }
        />

        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickImage(file, "logo");
            e.target.value = "";
          }}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickImage(file, "banner");
            e.target.value = "";
          }}
        />

        {/* Live preview card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          {/* Banner */}
          <div
            style={{
              position: "relative",
              height: "clamp(100px, 20vw, 160px)",
              background: "var(--line-100)",
            }}
          >
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SellerIcon name="image" size={32} color="var(--ink-300)" />
              </div>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => bannerInputRef.current?.click()}
              className="bz-hover-border"
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--r-md)",
                background: "rgba(255,255,255,.9)",
                border: "1px solid var(--line-200)",
                fontWeight: 600,
                fontSize: ".75rem",
                cursor: "pointer",
                color: "var(--ink-700)",
              }}
            >
              <SellerIcon name="image" size={14} color="var(--ink-600)" />
              {uploadBanner.isPending ? "Uploading…" : "Change banner"}
            </button>
          </div>

          {/* Logo + name row — logo overlaps banner; name reserves space via paddingLeft */}
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ position: "relative", minHeight: 40 }}>
              <div style={{ position: "absolute", left: 0, top: -36, zIndex: 1 }}>
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  {/* White ring + drop shadow keep the mark lifted off the banner */}
                  <div
                    style={{
                      borderRadius: "30%",
                      boxShadow: "0 0 0 3px #fff, 0 2px 8px rgba(0,0,0,.1)",
                    }}
                  >
                    <StoreAvatar src={logoUrl} name={shopName} size={72} />
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Change logo"
                    className="bz-hover-border"
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1px solid var(--line-200)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <SellerIcon name="edit" size={13} color="var(--ink-600)" />
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingLeft: 86,
                  paddingTop: 8,
                  paddingBottom: 4,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "1.125rem",
                      color: "var(--ink-900)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {shopName || "Your store name"}
                  </div>
                  {formatStoreAddress(storeAddress, storefront?.city) && (
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>
                      {formatStoreAddress(storeAddress, storefront?.city)}
                    </div>
                  )}
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemoveLogo()}
                    className="bz-hover-dim"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--ink-400)",
                      fontSize: ".75rem",
                      fontWeight: 600,
                      textDecoration: "underline",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {removeLogo.isPending ? "Removing…" : "Remove logo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit fields — store info gets one column, address + map gets two */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: narrow ? "1fr" : "minmax(0, 1fr) minmax(0, 2fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Store info: identity + description live together */}
          <Card style={{ marginBottom: 0 }}>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--ink-900)" }}>
                Store info
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>
                How buyers recognise and trust your shop.
              </p>
            </div>

            <Field
              label="Store name"
              width="name"
              hint="Visible to buyers on your store page and product listings."
            >
              <input
                className="bz-input"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Bhaktapur Handicraft"
                maxLength={256}
              />
            </Field>

            <Field
              label="About your store"
              hint="A short, honest intro converts browsers into buyers."
            >
              <textarea
                className="bz-input"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="What do you sell, and why should buyers trust you? e.g. “Handwoven pashmina from a family workshop in Bhaktapur since 1998 — genuine, fairly priced, free delivery inside the valley.”"
                style={{ minHeight: 150 }}
              />
            </Field>
          </Card>

          {/* Store location: wider column gives the map real room to work */}
          <Card style={{ marginBottom: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--ink-900)" }}>
                {t("seller.storeAddress")}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>
                {t("seller.storeAddressHint")}
              </p>
            </div>
            <LandmarkAddress value={storeAddress} onChange={setStoreAddress} />
          </Card>
        </div>
      </div>

      {/* Mobile: sticky save bar above the bottom nav, only when there's something to save */}
      {isMobile && isDirty && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: "calc(52px + env(safe-area-inset-bottom, 0px))",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px clamp(14px, 4vw, 20px)",
            background: "#fff",
            borderTop: "1px solid var(--line-200)",
            boxShadow: "0 -4px 16px rgba(0,0,0,.06)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: ".8125rem",
              fontWeight: 600,
              color: "var(--ink-600)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--blue)",
                flexShrink: 0,
              }}
            />
            Unsaved changes
          </span>
          <Button variant="primary" disabled={busy} onClick={() => void publish()}>
            {updateStorefront.isPending ? "Publishing…" : "Publish changes"}
          </Button>
        </div>
      )}
    </ApiState>
  );
}
