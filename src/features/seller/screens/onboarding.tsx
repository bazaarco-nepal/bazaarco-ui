"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, LandmarkAddress, AppLink } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { useBazaarStore } from "@/store/bazaar-store";
import { clearDeferredSellerOnboarding, deferSellerOnboarding } from "@/lib/seller-onboarding";
import {
  useSellerOrganization,
  useSetupSellerOrganization,
  useSubmitSellerVerification,
  useSellerStorefront,
} from "@/hooks/use-seller";
import { useBz } from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import { emptyStoreAddress, type StoreAddress } from "@/lib/store-address";
import { toast } from "@/lib/toast";
import { SellerHelpBar } from "../_shared/components";

// Short walkthrough that plays on the seller onboarding hero. Hosted on Drive
// rather than uploaded as an asset so the team can swap the clip without a deploy.
const SELLER_ONBOARDING_GUIDE_URL =
  "https://drive.google.com/file/d/1eoWLFEhF41YRdWcU1eWUNMNMwjn8K0B6/view?usp=drive_link";

/* ---------- 4.1 Seller Onboarding ---------- */
export function SellerOnboarding() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const user = useBazaarStore((s) => s.user);
  const reuploadIntent = useBazaarStore((s) => s.sellerReuploadIntent);
  const setReuploadIntent = useBazaarStore((s) => s.setSellerReuploadIntent);
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const savedStatus = verification?.status ?? "none";
  const setupOrganization = useSetupSellerOrganization();
  const submitVerification = useSubmitSellerVerification();
  // Sellers who already have a store (the add-another-store flow) entered the
  // store name and location at creation time. Pull the saved storefront so we
  // can pre-fill those fields here instead of asking again. Gated on `linked`
  // so a brand-new seller — who has no store yet — never fires this request.
  const { data: existingStorefront } = useSellerStorefront({
    enabled: !!organization?.linked,
  });
  const seededFromStore = useRef(false);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState("hero"); // hero | docPick | docUpload | review | done
  // Set when the seller chooses to re-upload from the "done" screen — lets the
  // upload flow run again even though the server now reports a pending status.
  const [forceReupload, setForceReupload] = useState(false);
  const [docType, setDocType] = useState<"pan" | "nid" | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [scanned, setScanned] = useState<{
    name: string;
    shop: string;
    docLabel: string;
    docId: string;
  } | null>(null);
  const [shopName, setShopName] = useState("");
  const [storeAddress, setStoreAddress] = useState<StoreAddress>(emptyStoreAddress);

  // Seed the store name and location from the already-created store so the
  // seller isn't asked for the same address twice. Runs once, and the
  // functional updates leave anything the seller has already typed untouched.
  useEffect(() => {
    if (seededFromStore.current || !existingStorefront) return;
    const savedName = existingStorefront.shopName?.trim() ?? "";
    const savedAddress = existingStorefront.storeAddress ?? null;
    if (!savedName && !savedAddress?.city) return;
    seededFromStore.current = true;
    if (savedName) setShopName((cur) => cur || savedName);
    if (savedAddress?.city) {
      setStoreAddress((cur) =>
        cur.city
          ? cur
          : {
              city: savedAddress.city,
              area: savedAddress.area ?? "",
              landmark: savedAddress.landmark ?? "",
              lat: savedAddress.lat ?? null,
              lng: savedAddress.lng ?? null,
            },
      );
    }
  }, [existingStorefront]);

  // The seller arrived from the KYC page's "Re-upload document" button. Drop them
  // straight into the document picker and let the flow run even while a previous
  // submission is still pending. We consume the one-shot flag so a later visit to
  // onboarding shows the normal status-aware screens again.
  useEffect(() => {
    if (!reuploadIntent) return;
    setForceReupload(true);
    setStage("docPick");
    setReuploadIntent(false);
  }, [reuploadIntent, setReuploadIntent]);

  const finishSetup = async () => {
    const name = (scanned?.shop || shopName || "").trim();
    const owner = (scanned?.name || "").trim();
    if (name.length < 2) {
      toast.error("Enter your store name to continue");
      return;
    }
    if (owner.length < 2) {
      toast.error("Enter the owner name to continue");
      return;
    }
    if (!docFile || !docType) {
      toast.error("Upload your NID or PAN photo first");
      return;
    }
    const storeCity = (storeAddress.city || "").trim();
    if (storeCity.length < 1) {
      toast.error("Enter your store location");
      return;
    }
    const docId = (scanned?.docId || "").trim();
    if (docId.length < 1) {
      toast.error(`Enter your ${scanned?.docLabel ?? "document"} number`);
      return;
    }
    try {
      await setupOrganization.mutateAsync({
        shopName: name,
        storeAddress: {
          city: storeCity,
          ...(storeAddress.area?.trim() ? { area: storeAddress.area.trim() } : {}),
          ...(storeAddress.landmark?.trim() ? { landmark: storeAddress.landmark.trim() } : {}),
          ...(storeAddress.lat != null ? { lat: storeAddress.lat } : {}),
          ...(storeAddress.lng != null ? { lng: storeAddress.lng } : {}),
        },
      });
      await submitVerification.mutateAsync({
        file: docFile,
        docType,
        docIdNumber: docId,
        ownerName: owner,
      });
      clearDeferredSellerOnboarding();
      setStage("done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not register your shop");
    }
  };

  const startDocUpload = (type: "pan" | "nid") => {
    setDocType(type);
    setScanned({
      // Pre-fill owner from the signup full name; the seller can correct it.
      name: user?.name ?? "",
      shop: "",
      docLabel: type === "pan" ? "PAN" : "NID",
      docId: "",
    });
    setStage("docUpload");
  };

  const onDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (docPreview) URL.revokeObjectURL(docPreview);
    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
  };

  // Honour server-saved verification state so re-entering onboarding never
  // discards a submission. Driven off the live query (not local state) so it
  // also reflects a submission made moments ago in this same session.
  // - approved → already done; send them to the dashboard
  // - pending  → submitted; show a calm "in review" screen, no restart
  // Only "none"/"rejected" fall through to the actual upload flow below.
  if (savedStatus === "approved") {
    return (
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px 28px 100px",
        }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <SellerHelpBar />
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <SellerIcon name="badgeCheck" size={42} color="var(--blue)" />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>You&apos;re verified</h1>
            <div style={{ marginTop: 24 }}>
              <Button variant="primary" size="md" full href={pathFromScreen("s-dashboard")}>
                Open dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (savedStatus === "pending" && stage !== "done" && !forceReupload && !reuploadIntent) {
    const submittedDoc = verification?.docType === "pan" ? "PAN" : "NID";
    return (
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px 28px 100px",
        }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <SellerHelpBar />
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(247,127,0,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <SellerIcon name="shieldCheck" size={42} color="var(--saffron)" />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
              You&apos;re all set — keep going
            </h1>
            <p style={{ color: "var(--ink-600)", marginTop: 8, fontSize: ".9375rem" }}>
              Your {submittedDoc} is submitted. Keep using your dashboard as usual — our team is
              checking your KYC and will update you soon. No need to upload anything again.
            </p>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "rgba(247,127,0,.08)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                color: "var(--ink-900)",
                textAlign: "left",
              }}
            >
              <SellerIcon
                name="shieldCheck"
                size={16}
                color="var(--saffron)"
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              Adding products and videos turns on once your KYC is approved — we&apos;ll let you
              know.
            </div>
            <div style={{ marginTop: 24 }}>
              <Button variant="primary" size="md" full href={pathFromScreen("s-dashboard")}>
                Open dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bz-container-pad"
      style={{
        maxWidth: "var(--seller-max, var(--container))",
        margin: "0 auto",
        padding: "20px 28px 100px",
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <SellerHelpBar />

        {stage === "hero" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "var(--r-lg)",
                background: "var(--tint-blue-50)",
                color: "var(--blue)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <SellerIcon name="store" size={30} color="var(--blue)" />
            </div>
            <h1
              style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600, color: "var(--ink-900)" }}
            >
              Open your shop on <span style={{ color: "var(--red)" }}>BazaarCo</span>
            </h1>

            <AppLink
              href={SELLER_ONBOARDING_GUIDE_URL}
              target="_blank"
              ariaLabel="Watch the 2-minute seller KYC setup guide (opens in a new tab)"
              className="bz-hover-lift"
              style={{
                background: "var(--tint-blue-50)",
                borderRadius: "var(--r-md)",
                padding: 14,
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <SellerIcon name="play" size={26} color="var(--blue)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>
                  Watch a 2-min seller KYC setup guide
                </div>
              </div>
              <SellerIcon name="chevronRight" size={20} color="var(--blue)" />
            </AppLink>

            <div style={{ marginTop: 22, textAlign: "left", padding: "0 4px" }}>
              {[
                ["Low commission marketplace", "percent", "/legal/commission-information"],
                ["Add a product in 3 taps", "plus"],
                ["Daily payouts to eSewa / Khalti", "wallet"],
              ].map(([t, i, href], idx, arr) => (
                <AppLink
                  key={t}
                  href={href || "#"}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: idx < arr.length - 1 ? "1px dashed var(--line-200)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                    cursor: href ? "pointer" : "default",
                  }}
                >
                  <SellerIcon name={i ?? ""} size={22} color="var(--blue)" />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{t}</div>
                  </div>
                </AppLink>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <Button
                variant="primary"
                size="md"
                full
                icon="image"
                onClick={() => {
                  clearDeferredSellerOnboarding();
                  setStage("docPick");
                }}
              >
                Register your shop
              </Button>
              <Button
                variant="ghost"
                full
                style={{ marginTop: 10 }}
                onClick={() => {
                  deferSellerOnboarding();
                  nav("s-dashboard");
                }}
              >
                I'll do this later
              </Button>
            </div>
          </div>
        )}

        {stage === "docPick" && (
          <div>
            <button
              onClick={() => (forceReupload ? nav("s-verification") : setStage("hero"))}
              className="bz-hover-tint"
              style={{
                background: "none",
                border: "none",
                borderRadius: "var(--r-sm)",
                color: "var(--ink-500)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                marginBottom: 14,
              }}
            >
              <SellerIcon name="chevronLeft" size={16} /> Back
            </button>
            <h2
              style={{
                margin: 0,
                fontSize: "1.375rem",
                fontWeight: 600,
                color: "var(--ink-900)",
              }}
            >
              Which document do you have?
            </h2>

            {[
              {
                id: "pan",
                icon: "package",
                title: "PAN Card",
                sub: "Registered business · sell any volume",
              },
              {
                id: "nid",
                icon: "user",
                title: "NID Card",
                sub: "Individual seller · PAN required once sales cross IRD limit",
              },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => startDocUpload(d.id as "pan" | "nid")}
                className="bz-hover-border"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 18,
                  marginBottom: 12,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--r-md)",
                    background: "var(--tint-blue-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SellerIcon name={d.icon} size={28} color="var(--blue)" />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "1rem" }}>{d.title}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>
                    {d.sub}
                  </div>
                </div>
                <SellerIcon name="chevronRight" size={22} color="var(--ink-400)" />
              </button>
            ))}
          </div>
        )}

        {stage === "docUpload" && (
          <div>
            <button
              onClick={() => setStage("docPick")}
              className="bz-hover-tint"
              style={{
                background: "none",
                border: "none",
                borderRadius: "var(--r-sm)",
                color: "var(--ink-500)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                gap: 6,
                marginBottom: 14,
              }}
            >
              <SellerIcon name="chevronLeft" size={16} /> Back
            </button>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.25rem", fontWeight: 600 }}>
              Upload your {docType === "pan" ? "PAN" : "NID"} photo
            </h2>
            <input
              ref={docInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={onDocFile}
            />
            {docPreview ? (
              <img
                src={docPreview}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "contain",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--line-200)",
                  marginBottom: 12,
                  background: "var(--line-100)",
                }}
              />
            ) : null}
            <Button
              variant="secondary"
              full
              icon="image"
              onClick={() => docInputRef.current?.click()}
            >
              {docPreview ? "Choose another photo" : "Choose from gallery or camera"}
            </Button>
            <div style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                full
                size="md"
                disabled={!docFile}
                onClick={() => setStage("review")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {stage === "review" && scanned && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--success)",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              <SellerIcon name="check" size={20} color="var(--success)" /> Document uploaded
            </div>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem", fontWeight: 600 }}>
              Confirm your details
            </h2>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Store name (required)
              </label>
              <input
                value={scanned.shop || shopName}
                onChange={(e) => {
                  const v = e.target.value;
                  setShopName(v);
                  setScanned((s) => (s ? { ...s, shop: v } : s));
                }}
                placeholder="e.g. Bhaktapur Handicraft"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".9375rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Owner name (required)
              </label>
              <input
                value={scanned.name ?? ""}
                onChange={(e) => setScanned((s) => (s ? { ...s, name: e.target.value } : s))}
                placeholder="Full Name. (For eg. Sandhya Karki)"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".9375rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                {t("seller.storeLocation")} (required)
              </label>
              <LandmarkAddress value={storeAddress} onChange={setStoreAddress} />
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                {scanned.docLabel} no. (required)
              </label>
              <input
                value={scanned.docId ?? ""}
                onChange={(e) => setScanned((s) => (s ? { ...s, docId: e.target.value } : s))}
                placeholder={`${scanned.docLabel} number as on your document`}
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".9375rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <Button
                variant="primary"
                full
                size="md"
                disabled={setupOrganization.isPending || submitVerification.isPending}
                onClick={() => void finishSetup()}
              >
                {setupOrganization.isPending || submitVerification.isPending
                  ? "Submitting for review…"
                  : "Submit for admin review"}
              </Button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <SellerIcon name="check" size={42} color="var(--success)" />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>Submitted for review</h1>
            <p style={{ color: "var(--ink-500)", marginTop: 6 }}>
              BazaarCo admin will verify your {docType === "pan" ? "PAN" : "NID"}. You can use the
              dashboard meanwhile.
            </p>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "rgba(247,127,0,.08)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                color: "var(--ink-900)",
                textAlign: "left",
              }}
            >
              <SellerIcon
                name="shieldCheck"
                size={16}
                color="var(--saffron)"
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              Adding products and videos unlocks after approval.
            </div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="primary" size="md" full href={pathFromScreen("s-dashboard")}>
                Open dashboard
              </Button>
              <Button
                variant="ghost"
                full
                onClick={() => {
                  if (docPreview) URL.revokeObjectURL(docPreview);
                  setDocFile(null);
                  setDocPreview(null);
                  setScanned(null);
                  setDocType(null);
                  setForceReupload(true);
                  setStage("docPick");
                }}
              >
                Re-upload document
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
