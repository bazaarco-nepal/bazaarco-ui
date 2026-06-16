"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, Spinner, Price, EmptyState, AppLink } from "@/components/ui";
import { SellerIcon } from "../_shared/icons";
import {
  FormSectionNav,
  FormActionBar,
  MessageBar,
  InfoTip,
  useLocalDraft,
  scrollToSection,
  ADD_PRODUCT_DRAFT_KEY,
  productDraftHasContent,
  type FormSection,
  type SectionState,
} from "../_shared/form-workflow";
import { ProductPhotoPicker, type ProductPhoto } from "@/components/seller/product-photo-picker";
import { SellerVerificationBlocked } from "@/components/seller/seller-verification-banner";
import { saleEffective, saleValid as isSaleValid, buildPricing } from "@/lib/discount";
import { formatNPR } from "@/lib/money";
import { cartesianVariantRows } from "@/lib/variant-selection";
import { useCategories, useProduct } from "@/hooks/use-catalog";
import { useUploadImage } from "@/hooks/use-media-upload";
import { type SellerInventoryItem } from "@/services/api/seller";
import { type CategoryAttributeField, type Product } from "@/types";
import { useCreateProduct, useUpdateProduct, useSellerOrganization } from "@/hooks/use-seller";
import { useBz, ProductCard } from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import { SellerHelpBar } from "../_shared/components";
import { editProductRef } from "../_shared/refs";

const RESERVED_METADATA_KEYS = new Set(["stock"]);

function labelFromMetadataKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function keyFromMetadataLabel(label: string) {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  const [first, ...rest] = words;
  return [
    (first ?? "").toLowerCase(),
    ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()),
  ].join("");
}

function uniqueMetadataKey(label: string, existing: Set<string>, current?: string) {
  const base = keyFromMetadataLabel(label);
  if (!base) return "";
  if (base === current || !existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}${i}`) && `${base}${i}` !== current) i += 1;
  return `${base}${i}`;
}

function cleanMetadata(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) => {
      if (RESERVED_METADATA_KEYS.has(key)) return false;
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
}

/* ---------- 4.4a Product metadata fields ---------- */
export function CategoryAttrFields({
  category,
  values,
  onChange,
}: {
  category: string;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const { data: categories = [] } = useCategories();
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [newMetaLabel, setNewMetaLabel] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");
  // Optional fields the seller has chosen to add (revealed from a suggestion chip)
  // but may not have filled yet. We can't lean on `values` for this because
  // cleanMetadata() drops empty entries, so an added-but-blank field would vanish.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  // Whether the "Custom detail" add row is showing.
  const [showCustom, setShowCustom] = useState(false);
  // Search-to-add: typing filters the suggestion list instead of scanning a
  // cloud of chips. `searchFocused` keeps the result list open while choosing.
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const cat = categories.find((c) => c.id === category);
  const fields = cat?.fields || [];
  const fieldKeys = new Set(fields.map((field) => field.k));
  const customKeys = Object.keys(values).filter(
    (key) => !fieldKeys.has(key) && !RESERVED_METADATA_KEYS.has(key),
  );
  // Required fields and anything already filled or explicitly opened show as rows;
  // everything else stays tucked behind a suggestion chip (progressive disclosure).
  const isShown = (f: CategoryAttributeField) =>
    f.req === true || values[f.k] !== undefined || opened.has(f.k);
  const shownFields = fields.filter(isShown);
  const chipFields = fields.filter((f) => !isShown(f));
  // Reset reveal state when the seller switches category — the old keys no longer
  // map to this category's fields.
  useEffect(() => {
    setOpened(new Set());
    setShowCustom(false);
  }, [category]);
  const inputStyle = {
    width: "100%",
    height: 48,
    fontSize: ".9375rem",
    border: "1px solid var(--line-200)",
    borderRadius: "var(--r-md)",
    padding: "0 14px",
    outline: "none",
    background: "#fff",
    fontFamily: "var(--font-sans)",
    color: "var(--ink-900)",
  };
  const buttonStyle = {
    minHeight: 40,
    padding: "0 12px",
    borderRadius: "var(--r-md)",
    border: "1px solid var(--line-200)",
    background: "#fff",
    color: "var(--ink-600)",
    fontWeight: 600,
    cursor: "pointer",
  };
  // Borderless control that lives inside a spec row (the row itself carries the
  // border + focus ring), so the input reads as plain text next to its label.
  const cellInput = {
    width: "100%",
    minWidth: 0,
    height: 40,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: 0,
    fontFamily: "var(--font-sans)",
    fontSize: ".9375rem",
    color: "var(--ink-900)",
  };
  const set = (k: string, v: unknown) => onChange(cleanMetadata({ ...values, [k]: v }));
  const remove = (k: string) => {
    const next = { ...values };
    delete next[k];
    onChange(cleanMetadata(next));
  };
  // Reveal an optional field as an editable row (from its suggestion chip).
  const openField = (k: string) => setOpened((prev) => new Set(prev).add(k));
  // Send an optional field back to the suggestion row: clear its value and reveal.
  const removeField = (k: string) => {
    setOpened((prev) => {
      const next = new Set(prev);
      next.delete(k);
      return next;
    });
    remove(k);
  };
  const toggleMulti = (k: string, opt: string) => {
    const cur = Array.isArray(values[k]) ? values[k] : [];
    set(k, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };
  const addOther = (k: string) => {
    const raw = (otherText[k] || "").trim();
    if (!raw) return;
    const cur = Array.isArray(values[k]) ? (values[k] as string[]) : [];
    if (!cur.some((x) => x.toLowerCase() === raw.toLowerCase())) set(k, [...cur, raw]);
    setOtherText((t) => ({ ...t, [k]: "" }));
  };
  const commitCustomLabel = (oldKey: string) => {
    const label = (customLabels[oldKey] ?? labelFromMetadataKey(oldKey)).trim();
    const existing = new Set(Object.keys(values));
    const nextKey = uniqueMetadataKey(label, existing, oldKey);
    if (!nextKey || nextKey === oldKey) return;
    const next = { ...values, [nextKey]: values[oldKey] };
    delete next[oldKey];
    onChange(cleanMetadata(next));
    setCustomLabels((labels) => {
      const copy = { ...labels };
      delete copy[oldKey];
      copy[nextKey] = label;
      return copy;
    });
  };
  const addCustom = () => {
    const label = newMetaLabel.trim();
    const value = newMetaValue.trim();
    if (!label || !value) return;
    const key = uniqueMetadataKey(label, new Set(Object.keys(values)));
    if (!key) return;
    onChange(cleanMetadata({ ...values, [key]: value }));
    setCustomLabels((labels) => ({ ...labels, [key]: label }));
    setNewMetaLabel("");
    setNewMetaValue("");
    setShowCustom(false);
  };
  const cancelCustom = () => {
    setNewMetaLabel("");
    setNewMetaValue("");
    setShowCustom(false);
  };
  // A field's editable control, sized to sit borderless inside a spec row.
  const renderControl = (f: CategoryAttributeField) => {
    if (f.t === "select") {
      return (
        <select
          value={(values[f.k] as string | number | undefined) || ""}
          onChange={(e) => set(f.k, e.target.value)}
          aria-label={f.en}
          style={{
            ...cellInput,
            cursor: "pointer",
            color: values[f.k] ? "var(--ink-900)" : "var(--ink-400)",
            fontWeight: values[f.k] ? 600 : 400,
          }}
        >
          <option value="">Choose…</option>
          {(f.o ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (f.t === "multi") {
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ...(f.o ?? []),
            ...((Array.isArray(values[f.k]) ? values[f.k] : []) as string[]).filter(
              (v) => !(f.o ?? []).includes(v),
            ),
          ].map((o) => {
            const selected = Array.isArray(values[f.k]) ? (values[f.k] as string[]) : [];
            const on = selected.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleMulti(f.k, o)}
                aria-pressed={on}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--r-full)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: ".8125rem",
                  minHeight: 40,
                  border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                  background: on ? "var(--tint-blue-50)" : "#fff",
                  color: on ? "var(--blue)" : "var(--ink-500)",
                }}
              >
                {on ? "✓ " : ""}
                {o}
              </button>
            );
          })}
          {f.allowOther && (
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input
                value={otherText[f.k] || ""}
                onChange={(e) => setOtherText((t) => ({ ...t, [f.k]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOther(f.k);
                  }
                }}
                placeholder="Other…"
                style={{
                  width: 120,
                  minHeight: 40,
                  padding: "0 12px",
                  borderRadius: "var(--r-full)",
                  border: "1.5px dashed var(--line-200)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: ".8125rem",
                  color: "var(--ink-900)",
                }}
              />
              <button
                type="button"
                onClick={() => addOther(f.k)}
                disabled={!(otherText[f.k] || "").trim()}
                style={{
                  minHeight: 40,
                  padding: "0 14px",
                  borderRadius: "var(--r-full)",
                  border: "1.5px solid var(--blue)",
                  background: "#fff",
                  color: "var(--blue)",
                  fontWeight: 600,
                  fontSize: ".8125rem",
                  cursor: (otherText[f.k] || "").trim() ? "pointer" : "default",
                  opacity: (otherText[f.k] || "").trim() ? 1 : 0.4,
                }}
              >
                + Add
              </button>
            </span>
          )}
        </div>
      );
    }
    if (f.t === "date") {
      return (
        <input
          type="date"
          value={(values[f.k] as string | number | undefined) || ""}
          onChange={(e) => set(f.k, e.target.value)}
          aria-label={f.en}
          style={cellInput}
        />
      );
    }
    if (f.t === "toggle") {
      const on = !!values[f.k];
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={f.en}
          onClick={() => set(f.k, !on)}
          style={{
            width: 46,
            height: 28,
            flexShrink: 0,
            justifySelf: "start",
            borderRadius: "var(--r-full)",
            border: "none",
            cursor: "pointer",
            padding: 3,
            background: on ? "var(--blue)" : "var(--line-200)",
            display: "inline-flex",
            justifyContent: on ? "flex-end" : "flex-start",
            transition: "background var(--dur-standard) var(--ease)",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              display: "block",
              boxShadow: "0 1px 2px rgba(0,0,0,.2)",
            }}
          />
        </button>
      );
    }
    // text / num
    return (
      <input
        value={(values[f.k] as string | number | undefined) || ""}
        inputMode={f.t === "num" ? "numeric" : undefined}
        onChange={(e) =>
          set(f.k, f.t === "num" ? e.target.value.replace(/\D/g, "") : e.target.value)
        }
        placeholder="Type here"
        aria-label={f.en}
        style={cellInput}
      />
    );
  };

  const q = query.trim().toLowerCase();
  const filteredChips = q ? chipFields.filter((f) => f.en.toLowerCase().includes(q)) : chipFields;
  const showResults = searchFocused || q.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Added rows — required fields always, plus anything the seller filled or opened */}
      {shownFields.map((f) => (
        <div className="bz-spec-row" key={f.k}>
          <div className="bz-spec-row__label">
            {f.en}
            {f.u && <span className="bz-spec-row__unit">({f.u})</span>}
            {f.req && <span className="bz-spec-row__req">Required</span>}
          </div>
          <div className="bz-spec-row__control">{renderControl(f)}</div>
          {!f.req && (
            <button
              type="button"
              onClick={() => removeField(f.k)}
              className="bz-spec-row__remove"
              aria-label={`Remove ${f.en}`}
            >
              <SellerIcon name="x" size={16} />
            </button>
          )}
          {f.help && <p className="bz-spec-row__help">{f.help}</p>}
        </div>
      ))}

      {/* Custom details the seller already added — label is editable */}
      {customKeys.map((key) => (
        <div key={key} className="bz-spec-row">
          <input
            value={customLabels[key] ?? labelFromMetadataKey(key)}
            onChange={(e) => setCustomLabels((labels) => ({ ...labels, [key]: e.target.value }))}
            onBlur={() => commitCustomLabel(key)}
            className="bz-spec-row__label"
            style={cellInput}
            aria-label="Detail name"
          />
          <input
            value={String(values[key] ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className="bz-spec-row__control"
            style={cellInput}
            aria-label="Detail value"
          />
          <button
            type="button"
            onClick={() => remove(key)}
            className="bz-spec-row__remove"
            aria-label="Remove custom detail"
          >
            <SellerIcon name="x" size={16} />
          </button>
        </div>
      ))}

      {/* Inline custom-detail editor (opened from the dashed chip) */}
      {showCustom && (
        <div className="bz-metadata-row">
          <input
            value={newMetaLabel}
            onChange={(e) => setNewMetaLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelCustom();
            }}
            placeholder="Detail name (e.g. Fabric origin)"
            style={inputStyle}
            aria-label="Custom detail name"
            autoFocus
          />
          <input
            value={newMetaValue}
            onChange={(e) => setNewMetaValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
              if (e.key === "Escape") cancelCustom();
            }}
            placeholder="Value"
            style={inputStyle}
            aria-label="Custom detail value"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={addCustom}
              disabled={!newMetaLabel.trim() || !newMetaValue.trim()}
              style={{
                ...buttonStyle,
                borderColor: "var(--blue)",
                color: "var(--blue)",
                opacity: newMetaLabel.trim() && newMetaValue.trim() ? 1 : 0.45,
              }}
            >
              Add
            </button>
            <button type="button" onClick={cancelCustom} style={buttonStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search-to-add: type to filter the suggestion list, tap a result to add it
          as a labelled field above (it then drops out of the list). Beats scanning
          a cloud of chips when a category has a long attribute list. */}
      {!showCustom && (
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search a detail to add…"
            aria-label="Search a detail to add"
            style={inputStyle}
          />
          {showResults && (
            <div
              style={{
                marginTop: 8,
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                background: "#fff",
                boxShadow: "var(--sh-2)",
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {filteredChips.map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    openField(f.k);
                    setQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    width: "100%",
                    padding: "11px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--line-100)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: ".9375rem",
                    fontWeight: 500,
                    color: "var(--ink-900)",
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--line-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span>
                    {f.en}
                    {f.u && <span style={{ color: "var(--ink-400)" }}> ({f.u})</span>}
                  </span>
                  <SellerIcon name="plus" size={16} color="var(--ink-400)" />
                </button>
              ))}
              {q.length > 0 && filteredChips.length === 0 && (
                <div
                  style={{ padding: "11px 14px", fontSize: ".8125rem", color: "var(--ink-400)" }}
                >
                  No matching suggestion — add it as a custom detail below.
                </div>
              )}
              {/* Custom detail — name the label yourself. Pre-fills with the query. */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (q.length > 0) setNewMetaLabel(query.trim());
                  setShowCustom(true);
                  setQuery("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "11px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: ".875rem",
                  fontWeight: 600,
                  color: "var(--blue)",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--line-100)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <SellerIcon name="edit" size={15} color="var(--blue)" />
                {q.length > 0 ? `Add “${query.trim()}” as a custom detail` : "Custom detail"}
              </button>
            </div>
          )}
        </div>
      )}

      <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-400)" }}>
        Tap any suggestion to add it as a field. More detail builds buyer trust.
      </p>
    </div>
  );
}

// Has the seller filled an attribute field? (multi=any selected, toggle=true, else non-empty)
export const attrFilled = (f: { t: string }, v: unknown) => {
  if (f.t === "multi") return Array.isArray(v) && v.length > 0;
  if (f.t === "toggle") return v === true;
  return !!v && (typeof v !== "string" || v.trim() !== "");
};

/* ---------- 4.4 Add / Edit Product — Three-Tap Listing ---------- */
// One form for both create and edit. In edit mode (`editing` set, threaded via
// `editProductRef`) the screen prefills from the existing product, locks the
// category (recategorizing is unsupported), and PATCHes instead of POSTing.
// Photos are editable in both modes; existing ones are seeded as remote entries
// so unchanged images are reused rather than re-uploaded.

// Seeds the photo picker from images already hosted on the CDN. `remoteUrl`
// marks them as upload-free; sourceName (from the URL) keeps duplicate
// detection working against newly added files.
function remotePhotoFromUrl(url: string, index: number): ProductPhoto {
  return {
    id: `existing-${index}-${url}`,
    previewUrl: url,
    remoteUrl: url,
    sourceName: url.split("/").pop()?.split("?")[0] || `photo-${index + 1}`,
  };
}

// Quick-pick option types for the variant builder. Tapping one seeds an option
// group with sensible default choices; "Custom" starts blank for anything else.
const VARIANT_OPTION_BUTTONS = ["Colour", "Size", "Material", "Pattern", "Custom"] as const;

const VARIANT_OPTION_SUGGESTIONS: Record<string, string[]> = {
  "mobile-phones-tablets": ["Colour", "Storage", "RAM", "Connectivity", "Custom"],
  "electronics-gadgets": ["Colour", "Size", "Capacity", "Pack size", "Custom"],
  "computers-accessories": ["Colour", "Storage", "RAM", "Size", "Custom"],
  "fashion-clothing": ["Colour", "Size", "Fit", "Material", "Sleeve", "Custom"],
  "shoes-footwear": ["Size", "Colour", "Material", "Style", "Heel height", "Custom"],
  "bags-watches-accessories": ["Colour", "Size", "Material", "Strap", "Dial size", "Custom"],
  "beauty-cosmetics": ["Shade", "Size", "Scent", "Pack size", "Custom"],
  "health-wellness": ["Size", "Flavour", "Pack size", "Strength", "Custom"],
  "groceries-essentials": ["Pack size", "Weight", "Flavour", "Quantity", "Type", "Custom"],
  "kitchenware-dining": ["Size", "Colour", "Material", "Capacity", "Set", "Custom"],
  "home-appliances": ["Capacity", "Colour", "Size", "Set", "Custom"],
  "home-decor": ["Colour", "Size", "Material", "Pattern", "Set", "Custom"],
  furniture: ["Colour", "Size", "Material", "Finish", "Seating capacity", "Custom"],
  "baby-kids-toys": ["Age", "Size", "Colour", "Pack size", "Style", "Custom"],
  "sports-fitness-outdoors": ["Size", "Colour", "Weight", "Material", "Resistance", "Custom"],
  "automotive-motorbike": ["Size", "Colour", "Pack size", "Material", "Custom"],
  "books-stationery": ["Format", "Language", "Binding", "Pack size", "Custom"],
  "musical-instruments": ["Size", "Colour", "Material", "Key", "Custom"],
  "pet-supplies": ["Size", "Flavour", "Pack size", "Pet size", "Colour", "Custom"],
  "local-nepali-handmade": ["Colour", "Size", "Material", "Pattern", "Set", "Custom"],
  electronics: ["Colour", "Storage", "RAM", "Capacity", "Custom"],
  fashion: ["Colour", "Size", "Fit", "Material", "Sleeve", "Custom"],
  "health-beauty": ["Shade", "Size", "Scent", "Pack size", "Custom"],
  "home-living": ["Colour", "Size", "Material", "Pattern", "Set", "Custom"],
  "mother-baby-kids": ["Age", "Size", "Colour", "Pack size", "Style", "Custom"],
  "sports-outdoors": ["Size", "Colour", "Weight", "Material", "Resistance", "Custom"],
  automotive: ["Size", "Colour", "Pack size", "Material", "Custom"],
  "crafts-heritage": ["Colour", "Size", "Material", "Pattern", "Set", "Custom"],
  "digital-goods-services": ["Plan", "Duration", "Language", "Format", "Custom"],
};

function variantOptionButtonsForCategory(categoryId: string) {
  return VARIANT_OPTION_SUGGESTIONS[categoryId] ?? [...VARIANT_OPTION_BUTTONS];
}

// Common choices offered as one-tap chips inside each option group.
const VARIANT_VALUE_PRESETS: Record<string, string[]> = {
  Age: ["0-6 months", "6-12 months", "1-2 years", "3-5 years", "6+ years"],
  Binding: ["Paperback", "Hardcover", "Spiral", "Board book"],
  Capacity: ["500ml", "1L", "2L", "5L", "10L", "20L"],
  Colour: ["Red", "Blue", "Black", "White", "Green", "Yellow", "Pink", "Brown", "Navy", "Gray"],
  Connectivity: ["4G", "5G", "Bluetooth", "Wi-Fi", "Wired", "Wireless"],
  Condition: ["New", "Like new", "Refurbished"],
  "Dial size": ["Small", "Medium", "Large", "38mm", "42mm", "45mm"],
  Duration: ["1 month", "3 months", "6 months", "1 year"],
  Edition: ["Standard", "Revised", "Latest", "Collector"],
  Finish: ["Matte", "Glossy", "Natural", "Polished", "Painted"],
  Fit: ["Regular", "Slim", "Relaxed", "Oversized"],
  Flavour: ["Original", "Chocolate", "Vanilla", "Strawberry", "Mint", "Lemon"],
  Format: ["Print", "Digital", "Audio", "PDF"],
  Grade: ["Nursery", "Grade 1", "Grade 5", "Grade 10", "SEE", "+2"],
  "Heel height": ["Flat", "Low", "Medium", "High"],
  Key: ["C", "D", "E", "F", "G", "A", "B"],
  Language: ["English", "Nepali", "Hindi"],
  Model: ["Standard", "Plus", "Pro", "Max"],
  Pack: ["Single", "Pack of 2", "Pack of 3", "Pack of 5"],
  "Pack size": ["Single", "Pack of 2", "Pack of 3", "Pack of 5", "Family pack"],
  Pattern: ["Plain", "Printed", "Striped", "Floral", "Checked"],
  "Pet size": ["Small", "Medium", "Large"],
  Plan: ["Basic", "Standard", "Premium"],
  Power: ["Battery", "Rechargeable", "USB", "220V"],
  Quantity: ["250g", "500g", "1kg", "2kg", "5kg"],
  RAM: ["4GB", "6GB", "8GB", "12GB", "16GB"],
  Resistance: ["Light", "Medium", "Heavy"],
  "Screen size": ["11 inch", "13 inch", "14 inch", "15 inch", "17 inch"],
  "Seating capacity": ["1 seater", "2 seater", "3 seater", "4 seater", "6 seater"],
  Set: ["Single", "Set of 2", "Set of 4", "Set of 6"],
  Scent: ["Unscented", "Rose", "Lavender", "Citrus", "Sandalwood"],
  Shade: ["Light", "Medium", "Dark", "Nude", "Pink", "Red"],
  "Skin type": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
  Color: ["Red", "Blue", "Black", "White", "Green", "Yellow", "Pink", "Brown", "Navy", "Gray"],
  Size: ["XS", "S", "M", "L", "XL", "XXL"],
  Storage: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  Strap: ["Leather", "Metal", "Silicone", "Fabric"],
  "Design/Style": ["Classic", "Bomber", "Varsity", "Slim", "Oversized"],
  Material: ["Cotton", "Polyester", "Leather", "Denim", "Wool"],
  Sleeve: ["Sleeveless", "Short sleeve", "Long sleeve", "Full sleeve"],
  Strength: ["Low", "Medium", "High", "Extra strong"],
  Style: ["Classic", "Modern", "Sport", "Casual", "Formal"],
  Type: ["Regular", "Organic", "Premium", "Imported", "Local"],
  "Vehicle type": ["Bike", "Scooter", "Car", "SUV", "Truck"],
  Weight: ["250g", "500g", "1kg", "2kg", "5kg"],
};

// Choices pre-filled when a preset option type is added, so the matrix has rows
// immediately. "Custom" and unlisted types start with a single empty choice.
const VARIANT_VALUE_DEFAULTS: Record<string, string[]> = {
  Colour: ["Red", "Blue"],
  Color: ["Red", "Blue", "Black"],
  Size: ["S", "M", "L"],
  Storage: ["128GB", "256GB"],
  RAM: ["4GB", "8GB"],
  Shade: ["Light", "Medium"],
  "Pack size": ["Single", "Pack of 2"],
  Capacity: ["1L", "2L"],
  Material: ["Cotton", "Polyester"],
  Pattern: ["Plain", "Printed"],
  Flavour: ["Original", "Chocolate"],
  "Design/Style": ["Classic", "Modern"],
};

// One image source per variant, resolved in priority order on the server:
// exact (per version) → option (per attribute value) → product main image. The
// seller picks which level to manage; the rest fall back automatically.
type VariantImageMode = "product" | "option" | "exact";

const optionImageKey = (attr: string, value: string) =>
  `${attr.trim().toLowerCase()}::${value.trim().toLowerCase()}`;

function variantDisplayName(
  optionValues: Record<string, string> | null | undefined,
  fallback: string,
) {
  const values = Object.values(optionValues ?? {}).filter(Boolean);
  return values.length ? values.join(" · ") : fallback;
}

function parseKeywordTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function SellerAddProduct({
  editing = null,
}: { editing?: SellerInventoryItem | null } = {}) {
  const { t } = useTranslation();
  const isEdit = Boolean(editing);
  const { nav, toast } = useBz();
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const vStatus = verification?.status ?? "none";
  const canSell = verification?.canSell === true;
  const { data: categories = [] } = useCategories();
  const uploadImage = useUploadImage();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  // Full product (description, category, specs) — only fetched when editing.
  const {
    data: editingProduct,
    isLoading: editingLoading,
    isError: editingError,
    error: editingErr,
  } = useProduct(isEdit ? (editing?.id ?? null) : null);
  // The product's images split the demo way: one Main image (the cover that
  // represents the product) + a Gallery (2–5). They compose, cover-first, into
  // the `images[]` the API stores (images[0] is the cover).
  const [mainPhoto, setMainPhoto] = useState<ProductPhoto[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<ProductPhoto[]>([]);
  const productPhotos = [...mainPhoto, ...galleryPhotos];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  // 'simple' = flat named variants (legacy), 'multi' = Daraz-style dimension matrix
  // How variant photos are managed: product main image (default), one image per
  // attribute value (option), or a per-version exact image. Drives the server's
  // image fallback chain.
  const [variantImageMode, setVariantImageMode] = useState<VariantImageMode>("product");
  // Which attribute drives option-level images (e.g. Color), and the uploaded
  // URL per "attr::value" key.
  const [optionImageAttr, setOptionImageAttr] = useState("");
  const [optionImageUrls, setOptionImageUrls] = useState<Record<string, string>>({});
  const [optionImageUploading, setOptionImageUploading] = useState<Record<string, boolean>>({});
  // Dimension groups for multi-dimensional mode e.g. [{name:"Color",options:["Orange","Black"]}]
  const [variantGroupDefs, setVariantGroupDefs] = useState<
    Array<{ id: number; name: string; options: string[] }>
  >([{ id: 1, name: "Color", options: [""] }]);
  const [variants, setVariants] = useState<
    Array<{
      id: string | number;
      name: string;
      price: string;
      stock: string;
      onSale?: boolean;
      saleMode?: "amount" | "percent";
      salePrice?: string;
      salePct?: string;
      allowBargaining?: boolean;
      minimumPrice?: string;
      optionValues?: Record<string, string> | null;
      imageUrl?: string | null;
      uploadingImg?: boolean;
    }>
  >([
    { id: 1, name: "Small", price: "", stock: "" },
    { id: 2, name: "Medium", price: "", stock: "" },
    { id: 3, name: "Large", price: "", stock: "" },
  ]);
  const [bargainOk, setBargainOk] = useState(true);
  const [bargainMinPrice, setBargainMinPrice] = useState("");
  // "Set the same price & stock for all" helper — fills every variant row at once
  // so a seller with a dozen versions isn't typing into two dozen boxes.
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  // Variant photos default to "same photo for all"; the extra photo modes stay
  // collapsed until the seller chooses to set different photos.
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  // Discount (single-price products only). `price` above holds the regular
  // price; on sale it becomes the struck-through `original` and the effective
  // price is `salePrice` (amount mode) or computed from `salePct` (percent mode).
  const [onSale, setOnSale] = useState(false);
  const [saleMode, setSaleMode] = useState<"amount" | "percent">("percent");
  const [salePrice, setSalePrice] = useState("");
  const [salePct, setSalePct] = useState("");
  const [attrs, setAttrs] = useState<Record<string, unknown>>({});

  // Structured PDP fields — warranty and brand. Shown on the product page as
  // first-class info (not buried in spec metadata). Returns follow the platform
  // default policy and are no longer set per product.
  const [brand, setBrand] = useState("");
  const [keywords, setKeywords] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [warrantyAvailable, setWarrantyAvailable] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [warrantyType, setWarrantyType] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");

  // Prefill once from the existing product when editing. The inventory row
  // (`editing`) carries the authoritative stock + variants; the fetched product
  // carries everything else. Strip a stray `stock` key out of metadata so it
  // can't shadow the real stock field the server tracks separately.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEdit || prefilled.current || !editingProduct) return;
    prefilled.current = true;
    const existingImages = editingProduct.images?.length
      ? editingProduct.images
      : [editingProduct.img, ...(editing?.images ?? [])].filter(Boolean);
    const existingPhotos = existingImages.map((url, i) => remotePhotoFromUrl(url as string, i));
    // First image is the main/cover; the rest seed the gallery.
    setMainPhoto(existingPhotos.slice(0, 1));
    setGalleryPhotos(existingPhotos.slice(1));
    setTitle(editingProduct.name ?? "");
    setDescription(editingProduct.description ?? "");
    setCategory(editingProduct.cat ?? "");
    const meta = { ...((editingProduct.metadata as Record<string, unknown>) ?? {}) };
    delete meta.stock;
    setAttrs(meta);
    // Structured PDP fields (warranty / returns / brand).
    setBrand(editingProduct.brand ?? "");
    setKeywords(editingProduct.keywords ?? "");
    const warranty = editingProduct.warranty;
    setWarrantyAvailable(Boolean(warranty?.available));
    setWarrantyMonths(warranty?.durationMonths ? String(warranty.durationMonths) : "");
    setWarrantyType(warranty?.type ?? "");
    setWarrantyNotes(warranty?.notes ?? "");
    // Product-level bargaining settings come from the seller-only inventory row
    // (`editing`), not the public product — the floor is never sent to buyers.
    setBargainOk(editing?.allowBargaining ?? false);
    setBargainMinPrice(editing?.minimumPrice ? String(editing.minimumPrice) : "");
    if (editing?.hasVariants && editing.variants?.length) {
      setHasVariants(true);
      const editingVG = (editingProduct as any)?.variantGroups as
        | Array<{ name: string; options: string[] }>
        | null
        | undefined;
      if (editingVG?.length) {
        setVariantGroupDefs(
          editingVG.map((g, i) => ({ id: i + 1, name: g.name, options: g.options })),
        );
      }
      // The API doesn't return option-level images, so we can only confidently
      // restore "exact" mode (any variant carries its own image); everything
      // else prefills as the product-image default and is left untouched on save.
      const anyExactImage = editing.variants.some((v) => (v as { imageUrl?: string }).imageUrl);
      setVariantImageMode(anyExactImage ? "exact" : "product");
      setVariants(
        editing.variants.map((v) => {
          // On sale: `price` is effective and `original` the base; the Price
          // field shows the base, and the sale inputs hold the discount.
          const onSale = Boolean(v.discountType && v.original);
          return {
            id: v.id,
            name: v.name,
            price: String(onSale ? v.original : v.price),
            stock: String(v.stock),
            onSale,
            saleMode: v.discountType === "amount" ? "amount" : "percent",
            salePrice: v.discountType === "amount" ? String(v.price) : "",
            salePct: v.discountType === "percent" ? String(v.discountPct ?? "") : "",
            allowBargaining: v.allowBargaining ?? false,
            minimumPrice: v.minimumPrice ? String(v.minimumPrice) : "",
            optionValues: (v as any).optionValues ?? null,
            imageUrl: (v as any).imageUrl ?? null,
          };
        }),
      );
    } else {
      setHasVariants(false);
      // When on sale, `price` (effective) and `original` (base) are stored
      // separately; the Price field always shows the regular (base) price.
      const dType = editingProduct.discountType ?? null;
      if (dType && editingProduct.original) {
        setOnSale(true);
        setPrice(String(editingProduct.original));
        if (dType === "percent") {
          setSaleMode("percent");
          setSalePct(editingProduct.discountPct ? String(editingProduct.discountPct) : "");
        } else {
          setSaleMode("amount");
          setSalePrice(String(editingProduct.price));
        }
      } else {
        setPrice(String(editingProduct.price ?? editing?.price ?? ""));
      }
      setStock(String(editing?.stock ?? ""));
    }
  }, [isEdit, editingProduct, editing]);

  // New category → start its attributes fresh (never carry the wrong category's fields).
  const pickCategory = (id: string) => {
    setCategory(id);
    setAttrs({});
  };

  const attrFields = categories.find((c) => c.id === category)?.fields || [];

  const titleOk = title.trim().length >= 3;
  const descriptionOk = description.trim().length >= 10;
  const categoryOk = Boolean(category);
  const specsOk = true;
  // Sale input for a variant row (the variant's Price field is its regular price).
  const variantSaleInput = (v: {
    price: string;
    saleMode?: string;
    salePrice?: string;
    salePct?: string;
  }) => ({
    base: Number(v.price) || 0,
    mode: (v.saleMode ?? "percent") as "amount" | "percent",
    salePrice: Number(v.salePrice) || 0,
    salePct: Number(v.salePct) || 0,
  });
  const variantsOk =
    !hasVariants ||
    variants.every((v) => v.price && v.stock && (!v.onSale || isSaleValid(variantSaleInput(v))));
  // 1 main image (the cover) + 2–5 gallery images, for new listings and edits.
  const photosOk = mainPhoto.length === 1 && galleryPhotos.length >= 2 && galleryPhotos.length <= 5;

  // Discount (single-price only). Pure math lives in @/lib/discount and mirrors
  // the server's authoritative rules so the seller gets immediate feedback.
  const applyDiscount = onSale && !hasVariants;
  const baseNum = Number(price) || 0;
  const saleInput = {
    base: baseNum,
    mode: saleMode,
    salePrice: Number(salePrice) || 0,
    salePct: Number(salePct) || 0,
  };
  const saleEffectivePrice = saleEffective(saleInput);
  const saleValid = !applyDiscount || isSaleValid(saleInput);

  // Bargaining needs a floor below the listed (effective) price, or it's enabled
  // but no offer could be accepted. Mirrors the server rule so the seller gets
  // the feedback before submitting. Checked per variant for variant products.
  const productListedPrice = applyDiscount ? saleEffectivePrice : baseNum;
  // The listed (effective) price a variant's floor must stay below.
  const variantListedPrice = (v: {
    price: string;
    onSale?: boolean;
    saleMode?: string;
    salePrice?: string;
    salePct?: string;
  }) => (v.onSale ? saleEffective(variantSaleInput(v)) : Number(v.price) || 0);
  // Live, per-variant validation for the min-bargain-price field. Returns an
  // error string to show under the field, or null when the row is fine. Mirrors
  // the server rule: a whole number above 0 and strictly below the variant's
  // own listed price. Fires independently for each variant row.
  const variantFloorError = (v: {
    price: string;
    onSale?: boolean;
    saleMode?: string;
    salePrice?: string;
    salePct?: string;
    allowBargaining?: boolean;
    minimumPrice?: string;
  }): string | null => {
    if (!v.allowBargaining) return null;
    const raw = (v.minimumPrice ?? "").trim();
    if (raw === "") return "Enter a lowest price to enable bargaining";
    const floor = Number(raw);
    if (!Number.isInteger(floor) || floor <= 0) return "Enter a whole number above 0";
    const listed = variantListedPrice(v);
    if (listed > 0 && floor >= listed) return `Must be less than ${formatNPR(listed)}`;
    return null;
  };
  const bargainFloorOk = hasVariants
    ? variants.every((v) => variantFloorError(v) === null)
    : !bargainOk || (Number(bargainMinPrice) > 0 && Number(bargainMinPrice) < productListedPrice);

  const canPublish =
    photosOk &&
    titleOk &&
    descriptionOk &&
    specsOk &&
    categoryOk &&
    saleValid &&
    bargainFloorOk &&
    (hasVariants ? variantsOk : price && stock);

  // ---------------------------------------------------------------------------
  // Guided workflow (frontend-only): section navigator + progress, a local
  // draft autosave, a validation summary and a review step. This layer is pure
  // presentation + local UI state — it never changes the submit payload, the
  // API calls or any validation/business rule above.
  // ---------------------------------------------------------------------------
  type ProductDraft = {
    title: string;
    description: string;
    category: string;
    price: string;
    stock: string;
    hasVariants: boolean;
    variantImageMode: VariantImageMode;
    variantGroupDefs: typeof variantGroupDefs;
    variants: typeof variants;
    attrs: Record<string, unknown>;
    brand: string;
    keywords: string;
    warrantyAvailable: boolean;
    warrantyMonths: string;
    warrantyType: string;
    warrantyNotes: string;
    onSale: boolean;
    saleMode: "amount" | "percent";
    salePrice: string;
    salePct: string;
    bargainOk: boolean;
    bargainMinPrice: string;
    optionImageUrls: Record<string, string>;
  };

  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Section progress — derived from the existing per-step validation flags.
  const sectionDone = {
    media: photosOk,
    basics: titleOk && descriptionOk && categoryOk,
    variants: (hasVariants ? variantsOk : Boolean(price && stock)) && saleValid,
    bargain: bargainFloorOk,
  };
  const sectionTouched = {
    media: productPhotos.length > 0,
    basics: Boolean(title || description || category),
    variants: Boolean(price || stock || hasVariants || onSale),
    bargain: !bargainOk || Boolean(bargainMinPrice),
  };
  const SECTION_DEFS: Array<{ id: string; label: string; key: keyof typeof sectionDone }> = [
    { id: "sec-media", label: "Photos", key: "media" },
    { id: "sec-basics", label: "Product details", key: "basics" },
    { id: "sec-variants", label: "Variants & pricing", key: "variants" },
    { id: "sec-bargain", label: "Bargaining", key: "bargain" },
  ];
  const navIds = [...SECTION_DEFS.map((s) => s.id), "sec-review"];
  // Paged wizard: one step visible at a time. `step` is the index into navIds;
  // the rail, Back/Next and the review "Fix" buttons all drive it. (Replaces the
  // old single-scroll + scroll-spy behaviour.)
  const [step, setStep] = useState(0);
  const activeSection = navIds[step] ?? navIds[0];
  const goToNav = (idx: number) => {
    const clamped = Math.max(0, Math.min(navIds.length - 1, idx));
    setStep(clamped);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // Jump to a step by its section id (rail clicks, "Fix" buttons). Falls back to
  // a plain scroll for non-step anchors like the validation summary.
  const goToSection = (id: string) => {
    const idx = navIds.indexOf(id);
    if (idx >= 0) goToNav(idx);
    else scrollToSection(id);
  };
  // Whether the current step's required fields are satisfied — gates the Next
  // button so sellers can't skip past an incomplete required step. The optional
  // bargaining step only blocks on a genuinely invalid floor price.
  const stepComplete = [
    sectionDone.media,
    sectionDone.basics,
    sectionDone.variants,
    sectionDone.bargain,
  ];
  const canAdvance = step >= stepComplete.length || stepComplete[step];
  const sections: FormSection[] = [
    ...SECTION_DEFS.map((s): FormSection => {
      // Paged wizard: the step you're on reads "In progress", finished steps get
      // a green check, attempted-but-incomplete steps flag an error, the rest are
      // "To do". (Only the current step is ever "active".)
      let state: SectionState;
      if (sectionDone[s.key]) state = "done";
      else if (s.id === activeSection) state = "active";
      else if (submitAttempted && sectionTouched[s.key]) state = "error";
      else state = "todo";
      return { id: s.id, label: s.label, state };
    }),
    {
      id: "sec-review",
      label: "Review & publish",
      state: canPublish ? "done" : activeSection === "sec-review" ? "active" : "todo",
    },
  ];

  // Publish-readiness checklist — one source of truth, shared by the Review
  // step and the sticky live-preview panel so they can never drift apart.
  const publishChecks: Array<{ ok: boolean; label: string; id: string }> = [
    { ok: mainPhoto.length === 1, label: "Main product photo added", id: "sec-media" },
    {
      ok: galleryPhotos.length >= 2 && galleryPhotos.length <= 5,
      label: "Gallery photos added (2–5)",
      id: "sec-media",
    },
    {
      ok: titleOk && descriptionOk,
      label: "Product name & description complete",
      id: "sec-basics",
    },
    { ok: categoryOk, label: "Category selected", id: "sec-basics" },
    {
      ok: hasVariants ? variantsOk : Boolean(price && stock),
      label: hasVariants ? "Every version has a price & stock" : "Price & stock added",
      id: "sec-variants",
    },
    { ok: bargainFloorOk, label: "Bargaining configured", id: "sec-bargain" },
  ];

  // What still needs fixing, grouped by section (frontend display only).
  const validationItems: Array<{ section: string; id: string; msg: string }> = [];
  if (!photosOk)
    validationItems.push({
      section: "Photos",
      id: "sec-media",
      msg: "Add 1 main photo and 2–5 gallery photos.",
    });
  if (!titleOk)
    validationItems.push({
      section: "Product details",
      id: "sec-basics",
      msg: "Product title needs at least 3 characters.",
    });
  if (!descriptionOk)
    validationItems.push({
      section: "Product details",
      id: "sec-basics",
      msg: "Description needs at least 10 characters.",
    });
  if (!categoryOk)
    validationItems.push({
      section: "Product details",
      id: "sec-basics",
      msg: "Choose a category.",
    });
  if (hasVariants ? !variantsOk : !(price && stock))
    validationItems.push({
      section: "Variants & pricing",
      id: "sec-variants",
      msg: hasVariants ? "Every version needs a price and stock." : "Set a price and stock.",
    });
  if (!saleValid)
    validationItems.push({
      section: "Variants & pricing",
      id: "sec-variants",
      msg: "Sale price must be below the listed price.",
    });
  if (!bargainFloorOk)
    validationItems.push({
      section: "Bargaining",
      id: "sec-bargain",
      msg: "Set a valid minimum price (below the listed price).",
    });

  // Local draft (new product only — editing already loads the real product).
  // Autosaves silently in the background and is resumed on mount, so a seller
  // who leaves mid-listing (or taps "Continue draft" from Inventory) lands back
  // where they left off.
  const draftEnabled = !isEdit;
  const draft = useLocalDraft<ProductDraft>(ADD_PRODUCT_DRAFT_KEY);
  const buildDraft = (): ProductDraft => ({
    title,
    description,
    category,
    price,
    stock,
    hasVariants,
    variantImageMode,
    variantGroupDefs,
    variants,
    attrs,
    brand,
    keywords,
    warrantyAvailable,
    warrantyMonths,
    warrantyType,
    warrantyNotes,
    onSale,
    saleMode,
    salePrice,
    salePct,
    bargainOk,
    bargainMinPrice,
    optionImageUrls,
  });
  // Debounced autosave once the seller has entered real (non-image) content.
  // Photos aren't part of the draft, so a photos-only form stays unsaved —
  // same predicate as the explicit Save-draft gate and the Inventory card, so
  // a draft is persisted only when there's something worth resuming.
  useEffect(() => {
    if (!draftEnabled) return;
    const next = buildDraft();
    if (!productDraftHasContent(next)) return;
    const handle = setTimeout(() => draft.write(next), 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draftEnabled,
    title,
    description,
    category,
    price,
    stock,
    hasVariants,
    variantImageMode,
    JSON.stringify(variantGroupDefs),
    JSON.stringify(variants),
    JSON.stringify(attrs),
    brand,
    keywords,
    warrantyAvailable,
    warrantyMonths,
    warrantyType,
    warrantyNotes,
    onSale,
    saleMode,
    salePrice,
    salePct,
    bargainOk,
    bargainMinPrice,
    JSON.stringify(optionImageUrls),
  ]);

  // Push a saved draft back into the form. Photos aren't part of the draft
  // (localStorage can't hold image blobs), so they're left for the seller to
  // re-add — every other field is restored verbatim.
  const applyDraft = (d: ProductDraft) => {
    setTitle(d.title);
    setDescription(d.description);
    setCategory(d.category);
    setPrice(d.price);
    setStock(d.stock);
    setHasVariants(d.hasVariants);
    setVariantImageMode(d.variantImageMode);
    setVariantGroupDefs(d.variantGroupDefs);
    setVariants(d.variants);
    setAttrs(d.attrs);
    setBrand(d.brand);
    setKeywords(d.keywords);
    setWarrantyAvailable(d.warrantyAvailable);
    setWarrantyMonths(d.warrantyMonths);
    setWarrantyType(d.warrantyType);
    setWarrantyNotes(d.warrantyNotes);
    setOnSale(d.onSale);
    setSaleMode(d.saleMode);
    setSalePrice(d.salePrice);
    setSalePct(d.salePct);
    setBargainOk(d.bargainOk);
    setBargainMinPrice(d.bargainMinPrice);
    setOptionImageUrls(d.optionImageUrls);
  };

  // Resume a saved draft on first mount (new-product flow only). Runs once —
  // the autosave above keeps writing afterwards, so this never fights it.
  const [resumedDraft, setResumedDraft] = useState(false);
  const draftResumed = useRef(false);
  useEffect(() => {
    if (isEdit || draftResumed.current) return;
    draftResumed.current = true;
    const saved = draft.read();
    if (saved && productDraftHasContent(saved)) {
      applyDraft(saved);
      setResumedDraft(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // "Start fresh" — drop the saved draft and reset the form to a blank listing.
  // Mirrors the initial useState values; fresh arrays each call so no two resets
  // share a mutable reference.
  const discardDraft = () => {
    draft.clear();
    setResumedDraft(false);
    applyDraft({
      title: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      hasVariants: false,
      variantImageMode: "product",
      variantGroupDefs: [{ id: 1, name: "Color", options: [""] }],
      variants: [
        { id: 1, name: "Small", price: "", stock: "" },
        { id: 2, name: "Medium", price: "", stock: "" },
        { id: 3, name: "Large", price: "", stock: "" },
      ],
      attrs: {},
      brand: "",
      keywords: "",
      warrantyAvailable: false,
      warrantyMonths: "",
      warrantyType: "",
      warrantyNotes: "",
      onSale: false,
      saleMode: "percent",
      salePrice: "",
      salePct: "",
      bargainOk: true,
      bargainMinPrice: "",
      optionImageUrls: {},
    });
    setMainPhoto([]);
    setGalleryPhotos([]);
    setSubmitAttempted(false);
    setStep(0);
    toast("Started a fresh product");
  };

  // Submit gate: surface the validation summary when something's missing,
  // otherwise hand off to the existing publish handler untouched.
  const attemptPublish = () => {
    if (publishing) return;
    if (!canPublish) {
      setSubmitAttempted(true);
      scrollToSection("sec-validation");
      return;
    }
    handlePublish();
  };

  const imageModeLabel =
    variantImageMode === "exact"
      ? "Separate image for every exact variant"
      : variantImageMode === "option"
        ? "Image changes by color/style"
        : "Same image for all variants";
  const variantPriceNums = variants.map((v) => Number(v.price)).filter((n) => n > 0);
  const reviewPriceRange = hasVariants
    ? variantPriceNums.length === 0
      ? "—"
      : Math.min(...variantPriceNums) === Math.max(...variantPriceNums)
        ? formatNPR(Math.min(...variantPriceNums))
        : `${formatNPR(Math.min(...variantPriceNums))} – ${formatNPR(Math.max(...variantPriceNums))}`
    : price
      ? formatNPR(Number(price))
      : "—";
  const reviewTotalStock = hasVariants
    ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
    : Number(stock) || 0;

  const categoryMeta = categories.find((c) => c.id === category);
  const variantOptionButtons = variantOptionButtonsForCategory(category);

  // Live preview reuses the real buyer ProductCard (DRY + pixel-exact) rather
  // than a look-alike, so the seller sees precisely what shoppers will. Built
  // from the current form state with the same discount math as the publish path.
  // For variant products the card shows the cheapest variant, matching how the
  // storefront lists a "from" price.
  const cheapestVariant = hasVariants
    ? [...variants]
        .filter((v) => (Number(v.price) || 0) > 0)
        .sort((a, b) => variantListedPrice(a) - variantListedPrice(b))[0]
    : undefined;
  const previewPrice = hasVariants
    ? cheapestVariant
      ? variantListedPrice(cheapestVariant)
      : 0
    : productListedPrice;
  const previewOriginal = hasVariants
    ? cheapestVariant?.onSale
      ? Number(cheapestVariant.price) || undefined
      : undefined
    : applyDiscount && saleEffectivePrice < baseNum
      ? baseNum
      : undefined;
  const previewProduct: Product = {
    id: editing?.id ?? "preview",
    name: title.trim() || "Untitled product",
    ne: editingProduct?.ne,
    price: previewPrice,
    original: previewOriginal,
    cat: category,
    seller: "",
    icon: editingProduct?.icon ?? "package",
    tint: categoryMeta?.tint ?? editingProduct?.tint ?? "slate",
    rating: editingProduct?.rating ?? 0,
    reviews: editingProduct?.reviews ?? 0,
    img: mainPhoto[0]?.previewUrl,
    hasVideo: editingProduct?.hasVideo,
  };

  const displayPrice = hasVariants ? variants.find((v) => v.price)?.price : price;
  const displayStock = hasVariants
    ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
    : stock;

  const updateVariant = (id: string | number, key: string, val: string | number | boolean) =>
    setVariants((arr) => arr.map((v) => (v.id === id ? { ...v, [key]: val } : v)));

  const keywordTags = parseKeywordTags(keywords);
  const addKeywordTag = (raw: string) => {
    const nextTags = parseKeywordTags(raw);
    if (!nextTags.length) return;
    const existing = new Set(keywordTags.map((tag) => tag.toLowerCase()));
    const merged = [...keywordTags];
    nextTags.forEach((tag) => {
      const key = tag.toLowerCase();
      if (!existing.has(key)) {
        existing.add(key);
        merged.push(tag);
      }
    });
    setKeywords(merged.join(", "));
    setKeywordDraft("");
  };
  const removeKeywordTag = (tag: string) => {
    setKeywords(keywordTags.filter((item) => item !== tag).join(", "));
  };

  const updateVariantDiscount = (id: string | number, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    const num = Number(digits);
    const salePct = digits && num > 0 ? String(Math.min(num, 99)) : "";
    setVariants((arr) =>
      arr.map((v) =>
        v.id === id
          ? {
              ...v,
              onSale: Boolean(salePct),
              saleMode: "percent",
              salePct,
              salePrice: "",
            }
          : v,
      ),
    );
  };

  // Apply one price and/or one stock to every variant row at once. Blank inputs
  // are left untouched, so a seller can set a shared price but keep stock per row.
  const applyBulkPriceStock = () => {
    const p = bulkPrice.trim();
    const s = bulkStock.trim();
    if (!p && !s) return;
    setVariants((arr) =>
      arr.map((v) => ({
        ...v,
        ...(p ? { price: p } : {}),
        ...(s ? { stock: s } : {}),
      })),
    );
  };

  // Quiet escape hatch: clear the price / stock a seller typed without
  // touching the options or the auto-generated rows themselves.
  const resetVariantValues = () => {
    setVariants((arr) =>
      arr.map((v) => ({
        ...v,
        price: "",
        stock: "",
        onSale: false,
        salePct: "",
        salePrice: "",
      })),
    );
    setBulkPrice("");
    setBulkStock("");
  };

  const handleVariantImageUpload = async (id: string | number, file: File) => {
    setVariants((arr) => arr.map((v) => (v.id === id ? { ...v, uploadingImg: true } : v)));
    try {
      const result = await uploadImage.mutateAsync({ file });
      setVariants((arr) =>
        arr.map((v) => (v.id === id ? { ...v, imageUrl: result.url, uploadingImg: false } : v)),
      );
    } catch {
      setVariants((arr) => arr.map((v) => (v.id === id ? { ...v, uploadingImg: false } : v)));
    }
  };

  const handleOptionImageUpload = async (attr: string, value: string, file: File) => {
    const key = optionImageKey(attr, value);
    setOptionImageUploading((m) => ({ ...m, [key]: true }));
    try {
      const result = await uploadImage.mutateAsync({ file });
      setOptionImageUrls((m) => ({ ...m, [key]: result.url }));
    } finally {
      setOptionImageUploading((m) => ({ ...m, [key]: false }));
    }
  };

  // ---------- Grouped variant helpers ----------

  /** Sync `variants` rows to match the current group definitions in multi mode.
   *  Groups are independent option lists, NOT axes of a combination matrix:
   *  one sellable row per full option combination, each with its own price and stock
   *  (see lib/variant-selection). Preserves price/stock for rows that already
   *  exist. */
  const syncMultiVariants = (groups: typeof variantGroupDefs) => {
    setVariants((prev) =>
      cartesianVariantRows(groups).map(({ name, optionValues }) => {
        const existing = prev.find(
          (v) => v.name === name || JSON.stringify(v.optionValues) === JSON.stringify(optionValues),
        );
        return {
          id: existing?.id ?? Date.now() + Math.random(),
          name,
          price: existing?.price ?? "",
          stock: existing?.stock ?? "",
          onSale: existing?.onSale ?? false,
          saleMode: existing?.saleMode ?? "percent",
          salePrice: existing?.salePrice ?? "",
          salePct: existing?.salePct ?? "",
          allowBargaining: existing?.allowBargaining ?? false,
          minimumPrice: existing?.minimumPrice ?? "",
          optionValues,
        };
      }),
    );
  };

  // Switch the product between single (no variants) and variant modes. Either
  // path resets the builder: "no variants" returns to the single-price form;
  // "has variants" starts from an empty options canvas (pick an option type).
  const chooseHasVariants = (next: boolean) => {
    setHasVariants(next);
    if (next) {
      const seedNames = variantOptionButtons.filter((name) => name !== "Custom").slice(0, 2);
      const seeded = seedNames.map((name, index) => ({
        id: Date.now() + index,
        name,
        options: VARIANT_VALUE_DEFAULTS[name] ??
          VARIANT_VALUE_PRESETS[name]?.slice(
            0,
            Math.min(3, VARIANT_VALUE_PRESETS[name].length),
          ) ?? [""],
      }));
      setVariantGroupDefs(seeded);
      syncMultiVariants(seeded);
    } else {
      setVariantGroupDefs([]);
      setVariants([]);
    }
    setVariantImageMode("product");
    setOptionImageAttr("");
    setOptionImageUrls({});
    setOptionImageUploading({});
    setShowPhotoOptions(false);
    setBulkPrice("");
    setBulkStock("");
  };

  const addGroupDef = () => {
    const next = [...variantGroupDefs, { id: Date.now(), name: "", options: [""] }];
    setVariantGroupDefs(next);
  };
  const removeGroupDef = (id: number) => {
    const next = variantGroupDefs.filter((g) => g.id !== id);
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };
  const updateGroupName = (id: number, name: string) => {
    const next = variantGroupDefs.map((g) => (g.id === id ? { ...g, name } : g));
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };
  const addGroupOption = (groupId: number) => {
    const next = variantGroupDefs.map((g) =>
      g.id === groupId ? { ...g, options: [...g.options, ""] } : g,
    );
    setVariantGroupDefs(next);
  };
  const updateGroupOption = (groupId: number, idx: number, val: string) => {
    const next = variantGroupDefs.map((g) =>
      g.id === groupId ? { ...g, options: g.options.map((o, i) => (i === idx ? val : o)) } : g,
    );
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };
  const removeGroupOption = (groupId: number, idx: number) => {
    const next = variantGroupDefs.map((g) =>
      g.id === groupId ? { ...g, options: g.options.filter((_, i) => i !== idx) } : g,
    );
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };

  /** Quick-add an option type (Color, Size, …) with sensible default choices.
   *  Named presets are de-duplicated; "Custom" starts blank for free typing. */
  const addPresetAttribute = (preset: string) => {
    const name = preset === "Custom" ? "" : preset;
    if (name && variantGroupDefs.some((g) => g.name.trim().toLowerCase() === name.toLowerCase())) {
      return;
    }
    const defaults = VARIANT_VALUE_DEFAULTS[preset] ?? [];
    const next = [
      ...variantGroupDefs,
      { id: Date.now(), name, options: defaults.length ? defaults : [""] },
    ];
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };

  /** Append a choice to an option group (deduped), then rebuild the matrix. */
  const addAttributeValue = (groupId: number, value: string) => {
    const optionValue = value.trim();
    if (!optionValue) return;
    const next = variantGroupDefs.map((g) => {
      if (g.id !== groupId) return g;
      const existing = g.options.map((o) => o.trim()).filter(Boolean);
      if (existing.some((o) => o.toLowerCase() === optionValue.toLowerCase())) return g;
      return { ...g, options: [...existing, optionValue] };
    });
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };

  /** Remove a single choice from an option group, then rebuild the matrix. */
  const removeAttributeValue = (groupId: number, value: string) => {
    const next = variantGroupDefs.map((g) =>
      g.id === groupId ? { ...g, options: g.options.filter((o) => o.trim() !== value) } : g,
    );
    setVariantGroupDefs(next);
    syncMultiVariants(next);
  };

  // Uncontrolled "add choice" inputs, one per option group — read on demand so
  // typing a new choice doesn't re-render the whole form on every keystroke.
  const choiceInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const submitChoiceInput = (groupId: number) => {
    const input = choiceInputRefs.current[groupId];
    if (!input) return;
    addAttributeValue(groupId, input.value);
    input.value = "";
    input.focus();
  };

  /** Builds the variantGroups payload from current group defs (variant products). */
  const buildVariantGroups = () => {
    if (!hasVariants) return undefined;
    const groups = variantGroupDefs
      .map((g) => ({ name: g.name.trim(), options: g.options.filter((o) => o.trim()) }))
      .filter((g) => g.name && g.options.length);
    return groups.length ? groups : undefined;
  };

  // The attribute names available to drive option-level images.
  const variantAttributeNames = variantGroupDefs
    .map((g) => g.name.trim())
    .filter((name, i, arr) => name && arr.indexOf(name) === i);
  // The attribute currently driving option images, falling back to a colour-like
  // one (or the first) when the saved choice is no longer present.
  const activeOptionImageAttr = variantAttributeNames.includes(optionImageAttr)
    ? optionImageAttr
    : variantAttributeNames.find((n) =>
        ["color", "colour", "design", "design/style", "style", "shade"].includes(n.toLowerCase()),
      ) ||
      variantAttributeNames[0] ||
      "";
  // Distinct choices of the driving attribute, for the per-value image uploaders.
  const optionImageValues = activeOptionImageAttr
    ? (variantGroupDefs.find((g) => g.name.trim() === activeOptionImageAttr)?.options ?? [])
        .map((o) => o.trim())
        .filter((o, i, arr) => o && arr.indexOf(o) === i)
    : [];
  // The photo block stays collapsed on the "same photo for all" default; it opens
  // when the seller asks for different photos, or when editing a product that
  // already uses a per-option / per-version photo. The middle option is named
  // after the option that actually drives the image (e.g. "One photo per Colour").
  const photoOptionsExpanded = showPhotoOptions || variantImageMode !== "product";
  const optionPhotoLabel = activeOptionImageAttr
    ? `One photo per ${activeOptionImageAttr}`
    : "One photo per option";

  /** Option-level images for the driving attribute, only in "option" mode.
   *  Omitted entirely otherwise so a normal edit never wipes server-side images. */
  const buildOptionImages = () => {
    if (!hasVariants || variantImageMode !== "option" || !activeOptionImageAttr) return undefined;
    const imgs = optionImageValues
      .map((value) => ({
        optionName: activeOptionImageAttr,
        optionValue: value,
        img: optionImageUrls[optionImageKey(activeOptionImageAttr, value)],
      }))
      .filter((entry): entry is { optionName: string; optionValue: string; img: string } =>
        Boolean(entry.img),
      );
    return imgs.length ? imgs : undefined;
  };

  // Pricing in the API's shape (price = effective/sale price, original = struck
  // base price). Variant products keep their existing product-level price and
  // carry no product-level discount in this phase. Shared by create and edit.
  const buildPricingPayload = () => {
    if (hasVariants) {
      // Product-level price is derived server-side from cheapest variant; send
      // a placeholder ≥ 1 to satisfy Zod. The actual price is ignored by the server.
      return {
        price: Math.max(1, Number(price || displayPrice || 1)),
        original: null,
        discountType: null,
        discountPct: null,
      };
    }
    // Prices are rupees end to end — the API stores exactly what's sent.
    return buildPricing(applyDiscount, saleInput);
  };

  // Variants the seller actually filled, in the API's shape. Shared by create
  // and edit so both paths agree on what a "complete" variant is.
  const buildVariants = () =>
    hasVariants
      ? variants
          .filter((v) => v.name && v.price && v.stock)
          .map((v) => {
            // All prices are entered and stored in rupees — no conversion.
            const pricing = v.onSale
              ? buildPricing(true, variantSaleInput(v))
              : {
                  price: Number(v.price),
                  original: null,
                  discountType: null,
                  discountPct: null,
                };
            return {
              id: String(v.id),
              name: v.name.trim(),
              stock: Number(v.stock),
              ...pricing,
              allowBargaining: v.allowBargaining ?? false,
              minimumPrice: v.allowBargaining && v.minimumPrice ? Number(v.minimumPrice) : null,
              optionValues: v.optionValues ?? null,
              // Only "exact" mode stores a per-version image; option/product modes
              // resolve on the server (option image → product main image).
              imageUrl: variantImageMode === "exact" ? (v.imageUrl ?? null) : null,
            };
          })
      : undefined;

  // Structured PDP fields shared by create + update. Warranty details are
  // cleared when warranty is off; "no returns" zeroes the window.
  const buildPdpFields = () => {
    return {
      brand: brand.trim() || null,
      keywords: keywords.trim() || null,
      warrantyAvailable,
      warrantyDurationMonths: warrantyAvailable ? Number(warrantyMonths) || null : null,
      warrantyType: warrantyAvailable ? warrantyType.trim() || null : null,
      warrantyNotes: warrantyAvailable ? warrantyNotes.trim() || null : null,
    };
  };

  const pdpFieldStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    fontSize: ".9375rem",
    border: "1px solid var(--line-200)",
    borderRadius: "var(--r-md)",
    padding: "0 14px",
    outline: "none",
    fontFamily: "var(--font-sans)",
    background: "#fff",
  };
  const pdpLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: ".8125rem",
    fontWeight: 600,
    color: "var(--ink-700)",
    marginBottom: 6,
  };

  // Publish: upload every photo (1 main + 2–5 gallery, cover first), then create
  // the product.
  // Edit: upload any newly added photos, then PATCH the changed fields (category
  // is never sent). Postgres is the source of truth; the server re-indexes it
  // into search in the background.
  const publishing = uploadImage.isPending || createProduct.isPending || updateProduct.isPending;
  const handlePublish = async () => {
    if (!canPublish || publishing) return;
    if (isEdit && editing) {
      try {
        // Upload only the newly captured photos; reuse already-hosted ones by
        // their CDN URL so an edit that doesn't touch photos costs no uploads.
        const images = await Promise.all(
          productPhotos.map(async (photo) => {
            if (!photo.file) return photo.remoteUrl as string;
            const uploaded = await uploadImage.mutateAsync({ file: photo.file });
            return uploaded.url;
          }),
        );
        await updateProduct.mutateAsync({
          id: editing.id,
          name: title.trim(),
          description: description.trim(),
          ...buildPricingPayload(),
          images,
          metadata: attrs,
          stock: hasVariants ? undefined : Number(stock) || 0,
          variants: buildVariants(),
          variantGroups: buildVariantGroups(),
          optionImages: buildOptionImages(),
          allowBargaining: hasVariants ? variants.some((v) => v.allowBargaining) : bargainOk,
          minimumPrice: hasVariants
            ? null
            : bargainOk && bargainMinPrice
              ? Number(bargainMinPrice)
              : null,
          ...buildPdpFields(),
        });
        toast("Product updated");
        nav("s-products");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not save changes. Please try again.");
      }
      return;
    }
    try {
      const uploaded = await Promise.all(
        productPhotos.map((photo) => uploadImage.mutateAsync({ file: photo.file! })),
      );
      const images = uploaded.map((u) => u.url);
      await createProduct.mutateAsync({
        name: title.trim(),
        description: description.trim(),
        ...buildPricingPayload(),
        categoryId: category,
        images,
        img: images[0],
        metadata: attrs,
        stock: hasVariants ? undefined : Number(stock) || 0,
        variants: buildVariants(),
        variantGroups: buildVariantGroups(),
        optionImages: buildOptionImages(),
        allowBargaining: hasVariants ? variants.some((v) => v.allowBargaining) : bargainOk,
        minimumPrice: hasVariants
          ? null
          : bargainOk && bargainMinPrice
            ? Number(bargainMinPrice)
            : null,
        ...buildPdpFields(),
      });
      toast("Product published!");
      draft.clear();
      nav("s-products");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not publish. Please try again.");
    }
  };

  if (!canSell) {
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <SellerVerificationBlocked
          actionLabel="add products"
          status={vStatus}
          note={verification?.note}
          onAction={vStatus === "pending" ? undefined : () => nav("s-onboarding")}
        />
      </div>
    );
  }

  // Editing: wait for the product before showing the form, so fields don't flash
  // empty then fill in. If it can't be loaded, send the seller back with a note.
  if (isEdit && !editingProduct) {
    if (editingError) {
      return (
        <div className="bz-seller-page">
          <SellerHelpBar />
          <EmptyState
            title="Couldn't load this product"
            message={
              editingErr instanceof Error
                ? editingErr.message
                : "It may have been removed. Go back to Inventory and try again."
            }
            cta="Back to Inventory"
            onCta={() => nav("s-products")}
          />
        </div>
      );
    }
    if (editingLoading || !editingProduct) {
      return (
        <div className="bz-seller-page">
          <div style={{ display: "flex", justifyContent: "center", padding: "96px 24px" }}>
            <Spinner />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="bz-seller-page bz-seller-page--wide">
      <div className="bz-seller-add-layout">
        <FormSectionNav sections={sections} activeId={activeSection} onJump={goToSection} />
        <div className="bz-seller-add-form">
          <SellerHelpBar />

          <AppLink
            href={pathFromScreen(isEdit ? "s-products" : "s-dashboard")}
            className="bz-back-link"
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-500)",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
              fontSize: ".875rem",
              textDecoration: "none",
            }}
          >
            <SellerIcon name="chevronLeft" size={16} />{" "}
            {isEdit ? "Back to Inventory" : "Back to dashboard"}
          </AppLink>

          {isEdit &&
            editing &&
            (editing.listingStatus === "frozen" ||
              editing.listingStatus === "pending_reinstatement") &&
            editing.moderationFeedback && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  border: "1.5px solid var(--red)",
                  background: "rgba(230,57,70,.06)",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--danger)", marginBottom: 6 }}>
                  This listing was taken down
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: ".875rem",
                    color: "var(--ink-700)",
                    lineHeight: 1.5,
                  }}
                >
                  {editing.moderationFeedback}
                </p>
                {editing.listingStatus === "frozen" && (
                  <p style={{ margin: "8px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                    Update the product below, then acknowledge from Inventory so our team can
                    restore it.
                  </p>
                )}
              </div>
            )}

          <h1
            style={{
              margin: "0 0 22px",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "var(--ink-900)",
            }}
          >
            {isEdit ? t("seller.products.editProduct") : t("seller.products.addAProduct")}
          </h1>

          {resumedDraft && (
            <MessageBar
              tone="info"
              title="Resumed your saved draft"
              onDismiss={() => setResumedDraft(false)}
              actions={
                <Button size="sm" variant="secondary" onClick={discardDraft}>
                  Start fresh
                </Button>
              }
            >
              Picked up where you left off. Photos aren&apos;t saved with drafts — re-add them
              before publishing.
            </MessageBar>
          )}

          {submitAttempted && !canPublish && validationItems.length > 0 && (
            <div id="sec-validation" className="bz-form-section">
              <MessageBar tone="error" title="Fix these before publishing">
                <ul
                  style={{
                    margin: "4px 0 0",
                    paddingInlineStart: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {validationItems.map((m, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => goToSection(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          font: "inherit",
                          textAlign: "left",
                          color: "var(--blue)",
                          cursor: "pointer",
                        }}
                      >
                        <strong>{m.section}:</strong> {m.msg}
                      </button>
                    </li>
                  ))}
                </ul>
              </MessageBar>
            </div>
          )}

          {/* Step 1 — Photos */}
          <div hidden={step !== 0}>
            <div id="sec-media" className="bz-form-section" aria-hidden="true" />
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: photosOk ? "var(--success)" : "var(--blue)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }}
                >
                  {photosOk ? <SellerIcon name="check" size={18} color="#fff" /> : 1}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    {isEdit ? "Photos" : "Add photos"}{" "}
                    <InfoTip text="The main photo is your product's cover — it represents the listing in search, feeds and the BazaarCo hub. Add 1 main photo + 2–5 gallery photos." />
                  </h3>
                </div>
              </div>

              {/* Main image — the single cover that represents the product. */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: ".8125rem",
                    fontWeight: 600,
                    color: "var(--ink-700)",
                    marginBottom: 2,
                  }}
                >
                  Main product image{" "}
                  <span style={{ color: "var(--red)", fontWeight: 600 }}>· required</span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: ".75rem", color: "var(--ink-500)" }}>
                  The cover shoppers see first in search, the storefront and the cart.
                </p>
                <ProductPhotoPicker photos={mainPhoto} onChange={setMainPhoto} min={1} max={1} />
              </div>

              {/* Gallery — the rest of the product photos. */}
              <div>
                <div
                  style={{
                    fontSize: ".8125rem",
                    fontWeight: 600,
                    color: "var(--ink-700)",
                    marginBottom: 2,
                  }}
                >
                  Gallery images{" "}
                  <span style={{ color: "var(--red)", fontWeight: 600 }}>· required</span>{" "}
                  <span style={{ color: "var(--ink-400)", fontWeight: 600 }}>· 2 to 5</span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: ".75rem", color: "var(--ink-500)" }}>
                  More angles, details and the product in use.
                </p>
                <ProductPhotoPicker
                  photos={galleryPhotos}
                  onChange={setGalleryPhotos}
                  min={2}
                  max={5}
                />
              </div>
            </div>
          </div>
          {/* Step 2 — Describe */}
          <div hidden={step !== 1}>
            <div id="sec-basics" className="bz-form-section" aria-hidden="true" />
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: titleOk && descriptionOk ? "var(--success)" : "var(--blue)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }}
                >
                  {titleOk && descriptionOk ? (
                    <SellerIcon name="check" size={18} color="#fff" />
                  ) : (
                    2
                  )}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Describe your product
                  </h3>
                </div>
              </div>

              <label
                style={{
                  fontSize: ".8125rem",
                  fontWeight: 600,
                  color: "var(--ink-700)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Product name
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Oversized Cotton T-Shirt or Handwoven Pashmina Shawl"
                style={{
                  width: "100%",
                  maxWidth: 440,
                  height: 56,
                  fontSize: "1rem",
                  border: `1px solid ${titleOk || !submitAttempted ? "var(--line-200)" : "var(--danger)"}`,
                  borderRadius: "var(--r-md)",
                  padding: "0 16px",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  marginBottom: titleOk ? 12 : 6,
                }}
              />
              {!titleOk && title.length > 0 && (
                <p style={{ fontSize: ".75rem", color: "var(--ink-500)", margin: "0 0 12px" }}>
                  Add at least {3 - title.trim().length} more character(s).
                </p>
              )}
              {!titleOk && title.length === 0 && (
                <p style={{ fontSize: ".75rem", color: "var(--ink-400)", margin: "0 0 12px" }}>
                  Required — buyers see this name first.
                </p>
              )}

              <label
                style={{
                  fontSize: ".8125rem",
                  fontWeight: 600,
                  color: "var(--ink-700)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Description <span style={{ color: "var(--red)", fontWeight: 600 }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Handwoven pashmina shawl in charcoal grey, made from 100% Himalayan cashmere by artisans in Kathmandu. Soft, lightweight and warm — perfect for everyday wear or gifting. Measures 200×70 cm and comes in five colours to match any outfit."
                rows={4}
                required
                minLength={10}
                style={{
                  width: "100%",
                  fontSize: "1rem",
                  border: `1px solid ${descriptionOk || !submitAttempted ? "var(--line-200)" : "var(--danger)"}`,
                  borderRadius: "var(--r-md)",
                  padding: "12px 16px",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  resize: "vertical",
                  marginBottom: descriptionOk ? 12 : 6,
                }}
              />
              {!descriptionOk && description.length > 0 && (
                <p style={{ fontSize: ".75rem", color: "var(--ink-500)", margin: "0 0 12px" }}>
                  Add at least {10 - description.trim().length} more character(s).
                </p>
              )}
              {!descriptionOk && description.length === 0 && (
                <p style={{ fontSize: ".75rem", color: "var(--ink-400)", margin: "0 0 12px" }}>
                  Required — shown to buyers on the product page.
                </p>
              )}

              <label
                style={{
                  fontSize: ".8125rem",
                  fontWeight: 600,
                  color: "var(--ink-700)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => pickCategory(e.target.value)}
                disabled={isEdit}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  height: 56,
                  fontSize: "1rem",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  padding: "0 14px",
                  outline: "none",
                  background: isEdit ? "var(--line-100)" : "#fff",
                  fontFamily: "var(--font-sans)",
                  color: category ? "var(--ink-900)" : "var(--ink-400)",
                  fontWeight: category ? 600 : 400,
                  cursor: isEdit ? "not-allowed" : "pointer",
                }}
              >
                <option value="">Pick a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.en}
                  </option>
                ))}
              </select>
              {!categoryOk && !isEdit && submitAttempted && (
                <p style={{ fontSize: ".75rem", color: "var(--danger)", marginTop: 6 }}>
                  Required — pick a category.
                </p>
              )}
              <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
                {isEdit
                  ? "Category can't be changed after a product is listed."
                  : "Picking the right category shows buyers the right details — and helps them find you."}
              </p>
            </div>

            {/* Product details — category-specific, optional but boosts findability */}
            {category && attrFields.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--tint-blue-50)",
                      color: "var(--blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SellerIcon name="sliders" size={18} color="var(--blue)" />
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Specifications{" "}
                    <span
                      style={{ fontSize: ".8125rem", fontWeight: 400, color: "var(--ink-400)" }}
                    >
                      · optional, add only what matters
                    </span>
                  </h3>
                </div>

                <CategoryAttrFields category={category} values={attrs} onChange={setAttrs} />
              </div>
            )}

            {/* Product identity — brand, your stock code and search keywords. Named
              honestly (these used to hide inside a "Warranty" card). */}
            {category && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--r-md)",
                      background: "var(--tint-blue-50)",
                      color: "var(--blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SellerIcon name="tag" size={18} color="var(--blue)" />
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Product identity{" "}
                    <span
                      style={{ fontSize: ".8125rem", fontWeight: 400, color: "var(--ink-400)" }}
                    >
                      · optional
                    </span>
                  </h3>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <label style={pdpLabelStyle}>Brand</label>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Samsung"
                      maxLength={128}
                      style={pdpFieldStyle}
                    />
                  </div>
                </div>

                {/* Search keywords (SEO) */}
                <div>
                  <label style={pdpLabelStyle}>Search keywords</label>
                  <div className="bz-keyword-builder">
                    {keywordTags.map((tag) => (
                      <span className="bz-keyword-chip" key={tag}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeKeywordTag(tag)}
                          aria-label={`Remove ${tag}`}
                        >
                          <SellerIcon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={keywordDraft}
                      onChange={(e) => setKeywordDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Tab") {
                          if (keywordDraft.trim()) {
                            e.preventDefault();
                            addKeywordTag(keywordDraft);
                          }
                        }
                        if (e.key === "Backspace" && !keywordDraft) {
                          const lastKeywordTag = keywordTags[keywordTags.length - 1];
                          if (lastKeywordTag) {
                            removeKeywordTag(lastKeywordTag);
                          }
                        }
                      }}
                      onBlur={() => addKeywordTag(keywordDraft)}
                      placeholder={
                        keywordTags.length ? "Add another keyword" : "Type keyword, press Enter"
                      }
                      maxLength={80}
                    />
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: ".75rem", color: "var(--ink-400)" }}>
                    If you add this, it becomes more visible to the buyers.
                  </p>
                </div>
              </div>
            )}

            {/* Warranty — a single progressive toggle. Off by default; the coverage
              fields only appear once it's switched on. */}
            {category && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--r-md)",
                      background: "var(--tint-blue-50)",
                      color: "var(--blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SellerIcon name="shieldCheck" size={18} color="var(--blue)" />
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Warranty{" "}
                    <span
                      style={{ fontSize: ".8125rem", fontWeight: 400, color: "var(--ink-400)" }}
                    >
                      · optional
                    </span>
                  </h3>
                </div>

                {/* Single toggle: nothing else shows until it's on. */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".9375rem", fontWeight: 600, color: "var(--ink-900)" }}>
                      This product comes with a warranty
                    </div>
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-400)", marginTop: 2 }}>
                      Turn on to add the coverage details buyers ask about.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={warrantyAvailable}
                    aria-label="This product comes with a warranty"
                    onClick={() => setWarrantyAvailable((v) => !v)}
                    style={{
                      flexShrink: 0,
                      width: 44,
                      height: 26,
                      borderRadius: "var(--r-full)",
                      border: "none",
                      padding: 0,
                      position: "relative",
                      cursor: "pointer",
                      background: warrantyAvailable ? "var(--blue)" : "var(--line-200)",
                      transition: "background var(--dur-standard) var(--ease)",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: warrantyAvailable ? 20 : 2,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                        transition: "left var(--dur-standard) var(--ease)",
                      }}
                    />
                  </button>
                </div>

                {warrantyAvailable && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <div>
                      <label style={pdpLabelStyle}>Warranty period (months)</label>
                      <input
                        type="number"
                        min={1}
                        max={240}
                        value={warrantyMonths}
                        onChange={(e) => setWarrantyMonths(e.target.value)}
                        placeholder="e.g. 12"
                        style={pdpFieldStyle}
                      />
                    </div>
                    <div>
                      <label style={pdpLabelStyle}>Who covers it (optional)</label>
                      <input
                        value={warrantyType}
                        onChange={(e) => setWarrantyType(e.target.value)}
                        placeholder="e.g. Manufacturer"
                        maxLength={64}
                        style={pdpFieldStyle}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={pdpLabelStyle}>What&rsquo;s covered (optional)</label>
                      <input
                        value={warrantyNotes}
                        onChange={(e) => setWarrantyNotes(e.target.value)}
                        placeholder="What the warranty covers"
                        maxLength={2000}
                        style={pdpFieldStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Step 3 — Product type & variants (single price/stock, or an options matrix) */}
          <div hidden={step !== 2}>
            <div id="sec-variants" className="bz-form-section" aria-hidden="true" />
            <div className="bz-variant-step">
              <section className="bz-variant-card">
                <h3 className="bz-variant-card__title">Does this come in different versions?</h3>
                <p className="bz-variant-card__helper">
                  Like the same shirt in different colours or sizes.
                </p>
                <div
                  className="bz-version-choice-grid"
                  role="radiogroup"
                  aria-label="Product versions"
                >
                  {(
                    [
                      [false, "No, just one", "One price and stock.", "package"],
                      [
                        true,
                        "Yes, a few versions",
                        "Different colours, sizes, and so on.",
                        "sliders",
                      ],
                    ] as const
                  ).map(([value, label, desc, icon]) => {
                    const selected = hasVariants === value;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`bz-version-choice ${selected ? "is-selected" : ""}`}
                        onClick={() => chooseHasVariants(value)}
                      >
                        <span className="bz-version-choice__title">
                          <SellerIcon name={icon} size={16} />
                          {label}
                        </span>
                        <span className="bz-version-choice__desc">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {!hasVariants ? (
                <section className="bz-variant-card">
                  <h3 className="bz-variant-card__title">Price &amp; stock</h3>
                  <p className="bz-variant-card__helper">
                    Set one price and stock count for this product.
                  </p>
                  <div className="bz-single-price-grid">
                    <label className="bz-field-plain">
                      <span>Price (Rs.)</span>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                        inputMode="numeric"
                        placeholder="1200"
                        className="tnum"
                        aria-invalid={!price && submitAttempted ? true : undefined}
                      />
                    </label>
                    <label className="bz-field-plain">
                      <span>Stock</span>
                      <input
                        value={stock}
                        onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        placeholder="15"
                        className="tnum"
                        aria-invalid={!stock && submitAttempted ? true : undefined}
                      />
                    </label>
                  </div>
                  <div className="bz-single-discount">
                    <label className="bz-radio-row bz-radio-row--compact">
                      <input
                        type="checkbox"
                        checked={onSale}
                        onChange={(e) => setOnSale(e.target.checked)}
                      />
                      <span>
                        <strong>Add a discount</strong>
                        <small>Optional. Buyers see the lower price.</small>
                      </span>
                    </label>
                    {onSale && (
                      <div className="bz-single-price-grid">
                        <label className="bz-field-plain">
                          <span>Discount (%)</span>
                          <input
                            value={salePct}
                            onChange={(e) =>
                              setSalePct(e.target.value.replace(/\D/g, "").slice(0, 2))
                            }
                            inputMode="numeric"
                            placeholder="20"
                            className="tnum"
                          />
                        </label>
                        <div className="bz-buyer-pay">
                          <span>Buyer pays</span>
                          {saleValid && price ? (
                            <>
                              <strong>{formatNPR(saleEffectivePrice)}</strong>
                              <small>Was {formatNPR(baseNum)}</small>
                            </>
                          ) : (
                            <strong>—</strong>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <>
                  <section className="bz-variant-card">
                    <h3 className="bz-variant-card__title">What versions?</h3>
                    <p className="bz-variant-card__helper">
                      Pick the choices — we make a row for every combination automatically.
                    </p>

                    <div className="bz-option-groups">
                      {variantGroupDefs.map((group) => {
                        const presets = VARIANT_VALUE_PRESETS[group.name.trim()] ?? [];
                        const currentValues = group.options
                          .map((o) => o.trim())
                          .filter((o, i, arr) => o && arr.indexOf(o) === i);
                        const unusedPresets = presets.filter(
                          (p) => !currentValues.some((v) => v.toLowerCase() === p.toLowerCase()),
                        );
                        return (
                          <div className="bz-option-group" key={group.id}>
                            <div className="bz-option-group__top">
                              <input
                                value={group.name}
                                onChange={(e) => updateGroupName(group.id, e.target.value)}
                                placeholder="Option name"
                                className="bz-option-name"
                                aria-label="Option name"
                              />
                              <button
                                type="button"
                                className="bz-option-remove"
                                onClick={() => removeGroupDef(group.id)}
                                aria-label={`Remove ${group.name || "option"}`}
                              >
                                <SellerIcon name="trash" size={14} />
                              </button>
                            </div>
                            <div className="bz-chip-row">
                              {currentValues.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  className="bz-choice-chip is-selected"
                                  onClick={() => removeAttributeValue(group.id, value)}
                                  title={`Remove ${value}`}
                                >
                                  {value}
                                </button>
                              ))}
                              {unusedPresets.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  className="bz-choice-chip"
                                  onClick={() => addAttributeValue(group.id, value)}
                                >
                                  + {value}
                                </button>
                              ))}
                            </div>
                            <div className="bz-custom-choice">
                              <input
                                ref={(el) => {
                                  choiceInputRefs.current[group.id] = el;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    submitChoiceInput(group.id);
                                  }
                                }}
                                placeholder="Add a choice"
                              />
                              <button type="button" onClick={() => submitChoiceInput(group.id)}>
                                Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bz-add-option-row">
                      {variantOptionButtons.map((preset) => {
                        const already =
                          preset !== "Custom" &&
                          variantGroupDefs.some(
                            (g) => g.name.trim().toLowerCase() === preset.toLowerCase(),
                          );
                        return (
                          <button
                            key={preset}
                            type="button"
                            className="bz-add-option"
                            onClick={() => addPresetAttribute(preset)}
                            disabled={already}
                          >
                            + {preset}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="bz-variant-card">
                    <div className="bz-photo-card-head">
                      <span className="bz-photo-card-head__num">4</span>
                      <div>
                        <h3 className="bz-variant-card__title">
                          Do the versions look different in photos?
                        </h3>
                        <p className="bz-variant-card__helper">You can change this anytime.</p>
                      </div>
                    </div>
                    <div className="bz-radio-stack">
                      {(
                        [
                          [
                            "product",
                            "No, the photo is the same",
                            "Every version shows your main product photo.",
                          ],
                          [
                            "option",
                            activeOptionImageAttr
                              ? `Yes — different by ${activeOptionImageAttr.toLowerCase()}`
                              : "Yes — different by option",
                            `Add one photo per ${activeOptionImageAttr.toLowerCase() || "option"}. Sizes share it.`,
                          ],
                          [
                            "exact",
                            "Each version has its own photo",
                            "Add a photo to each row in the table below.",
                          ],
                        ] as const
                      ).map(([mode, label, desc]) => {
                        const selected = variantImageMode === mode;
                        return (
                          <label
                            key={mode}
                            className={`bz-radio-row ${selected ? "is-selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name="variantImageMode"
                              checked={selected}
                              onChange={() => {
                                setVariantImageMode(mode);
                                setShowPhotoOptions(true);
                                if (mode === "option") setOptionImageAttr(activeOptionImageAttr);
                              }}
                            />
                            <span>
                              <strong>{label}</strong>
                              <small>{desc}</small>
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {variantImageMode === "option" && (
                      <div className="bz-photo-tile-row">
                        {optionImageValues.map((value) => {
                          const key = optionImageKey(activeOptionImageAttr, value);
                          const url = optionImageUrls[key];
                          const uploading = optionImageUploading[key];
                          return (
                            <div className="bz-photo-choice" key={value}>
                              <label className="bz-photo-tile">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      void handleOptionImageUpload(
                                        activeOptionImageAttr,
                                        value,
                                        file,
                                      );
                                    e.target.value = "";
                                  }}
                                />
                                {uploading ? (
                                  <Spinner size={16} />
                                ) : url ? (
                                  <img src={url} alt="" />
                                ) : (
                                  <>
                                    <SellerIcon name="camera" size={18} />
                                    <span>Add photo</span>
                                  </>
                                )}
                              </label>
                              <span>{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {variantImageMode === "exact" && (
                      <div className="bz-photo-tile-row">
                        {variants.map((v) => {
                          const label = variantDisplayName(v.optionValues, v.name);
                          return (
                            <div className="bz-photo-choice" key={v.id}>
                              <label className="bz-photo-tile">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleVariantImageUpload(v.id, file);
                                    e.target.value = "";
                                  }}
                                />
                                {v.uploadingImg ? (
                                  <Spinner size={16} />
                                ) : v.imageUrl ? (
                                  <img src={v.imageUrl} alt="" />
                                ) : (
                                  <>
                                    <SellerIcon name="camera" size={18} />
                                    <span>Add photo</span>
                                  </>
                                )}
                              </label>
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="bz-variant-card">
                    <h3 className="bz-variant-card__title">Price &amp; stock</h3>
                    <p className="bz-variant-card__helper">
                      Set a price for each version. A discount is optional — buyers see the lower
                      price.
                    </p>

                    <div className="bz-vbulk">
                      <label className="bz-vbulk__field">
                        <span>Price for all (Rs.)</span>
                        <input
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value.replace(/[^\d.]/g, ""))}
                          inputMode="numeric"
                          placeholder="1200"
                          className="tnum"
                          aria-label="Price for all versions"
                        />
                      </label>
                      <label className="bz-vbulk__field">
                        <span>Stock for all</span>
                        <input
                          value={bulkStock}
                          onChange={(e) => setBulkStock(e.target.value.replace(/\D/g, ""))}
                          inputMode="numeric"
                          placeholder="10"
                          className="tnum"
                          aria-label="Stock for all versions"
                        />
                      </label>
                      <button
                        type="button"
                        className="bz-vbulk__button"
                        onClick={applyBulkPriceStock}
                        disabled={!bulkPrice.trim() && !bulkStock.trim()}
                      >
                        Apply to all {variants.length}
                      </button>
                    </div>

                    <div className="bz-vtable">
                      <div className="bz-vrow bz-vhead">
                        <span>Version</span>
                        <span>Price (Rs.)</span>
                        <span>Discount</span>
                        <span>Buyer pays</span>
                        <span>Stock</span>
                      </div>
                      {variants.map((v) => {
                        const label = variantDisplayName(v.optionValues, v.name);
                        const priceNum = Number(v.price) || 0;
                        const discount = v.onSale ? Number(v.salePct) || 0 : 0;
                        const buyerPays = priceNum
                          ? Math.round((priceNum * (100 - discount)) / 100)
                          : 0;
                        return (
                          <div key={v.id} className="bz-vrow">
                            <div className="bz-vcell bz-vcell--version">
                              <span className="bz-vcell__lbl">Version</span>
                              <strong>{label}</strong>
                            </div>
                            <label className="bz-vcell">
                              <span className="bz-vcell__lbl">Price (Rs.)</span>
                              <input
                                value={v.price}
                                onChange={(e) =>
                                  updateVariant(
                                    v.id,
                                    "price",
                                    e.target.value.replace(/[^\d.]/g, ""),
                                  )
                                }
                                inputMode="numeric"
                                placeholder="0"
                                className="tnum bz-vcell__input"
                                aria-label={`Price for ${label}`}
                              />
                            </label>
                            <label className="bz-vcell bz-vcell--discount">
                              <span className="bz-vcell__lbl">Discount</span>
                              <span className="bz-percent-input">
                                <input
                                  value={v.onSale ? (v.salePct ?? "") : ""}
                                  onChange={(e) => updateVariantDiscount(v.id, e.target.value)}
                                  inputMode="numeric"
                                  placeholder="0"
                                  className="tnum bz-vcell__input"
                                  aria-label={`Discount for ${label}`}
                                />
                                <span>%</span>
                              </span>
                            </label>
                            <div className="bz-vcell bz-vcell--buyer">
                              <span className="bz-vcell__lbl">Buyer pays</span>
                              {!priceNum ? (
                                <strong>—</strong>
                              ) : discount ? (
                                <>
                                  <small className="bz-was">{formatNPR(priceNum)}</small>
                                  <strong>{formatNPR(buyerPays)}</strong>
                                  <small className="bz-save">Save {discount}%</small>
                                </>
                              ) : (
                                <strong>{formatNPR(priceNum)}</strong>
                              )}
                            </div>
                            <label className="bz-vcell">
                              <span className="bz-vcell__lbl">Stock</span>
                              <input
                                value={v.stock}
                                onChange={(e) =>
                                  updateVariant(v.id, "stock", e.target.value.replace(/\D/g, ""))
                                }
                                inputMode="numeric"
                                placeholder="0"
                                className="tnum bz-vcell__input"
                                aria-label={`Stock for ${label}`}
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>

          {/* Legacy variants block kept inert while the desktop card layout above owns this step. */}
          <div hidden>
            <div id="sec-variants-legacy" className="bz-form-section" aria-hidden="true" />
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: (hasVariants ? variantsOk : price && stock)
                      ? "var(--success)"
                      : "var(--ink-400)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }}
                >
                  {(hasVariants ? variantsOk : price && stock) ? (
                    <SellerIcon name="check" size={18} color="#fff" />
                  ) : (
                    3
                  )}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Options
                    <InfoTip text="A version is one thing a buyer can pick and buy — e.g. Red / Medium — with its own price and stock. Turn this on when the same product sells in different colours, sizes, and so on." />
                  </h3>
                </div>
              </div>

              {/* Does this come in different versions? A plain yes/no a shopkeeper
                can answer — two cards, one for a single product and one for many. */}
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: ".9375rem",
                  fontWeight: 600,
                  color: "var(--ink-800)",
                }}
              >
                Does this come in different versions?
              </p>
              <p style={{ margin: "0 0 10px", fontSize: ".75rem", color: "var(--ink-400)" }}>
                Like a t-shirt in different sizes, or a phone in different colours.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {(
                  [
                    [
                      false,
                      "No — just one version",
                      "One price and one stock for the whole product.",
                    ],
                    [
                      true,
                      "Yes — different colours, sizes, etc.",
                      "Set a price and stock for each version.",
                    ],
                  ] as const
                ).map(([value, label, desc]) => {
                  const selected = hasVariants === value;
                  return (
                    <label
                      key={label}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        padding: "12px 14px",
                        borderRadius: "var(--r-md)",
                        border: selected
                          ? "1.5px solid var(--blue-deep)"
                          : "1px solid var(--line-200)",
                        background: selected ? "var(--tint-blue-50)" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="productType"
                        checked={selected}
                        onChange={() => chooseHasVariants(value)}
                        style={{ marginTop: 2, accentColor: "var(--blue-deep)" }}
                      />
                      <span>
                        <span
                          style={{
                            display: "block",
                            fontSize: ".875rem",
                            fontWeight: 600,
                            color: "var(--ink-800)",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{ display: "block", fontSize: ".75rem", color: "var(--ink-500)" }}
                        >
                          {desc}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {!hasVariants ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label
                        style={{
                          fontSize: ".8125rem",
                          fontWeight: 600,
                          color: "var(--ink-700)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Price (Rs.)
                      </label>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                        inputMode="numeric"
                        placeholder="1200"
                        className="tnum"
                        style={{
                          width: "100%",
                          height: 64,
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          textAlign: "center",
                          border: `1px solid ${price || !submitAttempted ? "var(--line-200)" : "var(--danger)"}`,
                          borderRadius: "var(--r-md)",
                          fontFamily: "var(--font-sans)",
                          outline: "none",
                        }}
                      />
                      {!price && submitAttempted && (
                        <p
                          style={{
                            fontSize: ".75rem",
                            color: "var(--danger)",
                            textAlign: "center",
                            margin: "6px 0 0",
                          }}
                        >
                          Required
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: ".8125rem",
                          fontWeight: 600,
                          color: "var(--ink-700)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Stock
                      </label>
                      <input
                        value={stock}
                        onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        placeholder="15"
                        className="tnum"
                        style={{
                          width: "100%",
                          height: 64,
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          textAlign: "center",
                          border: `1px solid ${stock || !submitAttempted ? "var(--line-200)" : "var(--danger)"}`,
                          borderRadius: "var(--r-md)",
                          fontFamily: "var(--font-sans)",
                          outline: "none",
                        }}
                      />
                      {!stock && submitAttempted && (
                        <p
                          style={{
                            fontSize: ".75rem",
                            color: "var(--danger)",
                            textAlign: "center",
                            margin: "6px 0 0",
                          }}
                        >
                          Required
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Discount (sale) — single-price products. The Price above is the
                  regular price; this sets the discounted price buyers see. */}
                  <div
                    style={{
                      marginTop: 14,
                      border: "1px solid var(--line-200)",
                      borderRadius: "var(--r-md)",
                      padding: 14,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        fontWeight: 600,
                        color: "var(--ink-700)",
                        fontSize: ".9375rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={onSale}
                        onChange={(e) => setOnSale(e.target.checked)}
                      />
                      Put this product on sale
                    </label>

                    {onSale && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          {(
                            [
                              ["percent", "% off"],
                              ["amount", "Set sale price"],
                            ] as const
                          ).map(([mode, label]) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setSaleMode(mode)}
                              style={{
                                flex: 1,
                                height: 40,
                                borderRadius: "var(--r-md)",
                                border:
                                  saleMode === mode
                                    ? "1.5px solid var(--blue-deep)"
                                    : "1px solid var(--line-200)",
                                background: saleMode === mode ? "var(--tint-blue-50)" : "#fff",
                                color: saleMode === mode ? "var(--blue-deep)" : "var(--ink-600)",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {saleMode === "percent" ? (
                          <div>
                            <label
                              style={{
                                fontSize: ".8125rem",
                                fontWeight: 600,
                                color: "var(--ink-700)",
                                display: "block",
                                marginBottom: 6,
                              }}
                            >
                              Discount (%)
                            </label>
                            <input
                              value={salePct}
                              onChange={(e) =>
                                setSalePct(e.target.value.replace(/\D/g, "").slice(0, 2))
                              }
                              inputMode="numeric"
                              placeholder="e.g. 20"
                              className="tnum"
                              style={{
                                width: "100%",
                                height: 48,
                                padding: "0 12px",
                                border: "1px solid var(--line-200)",
                                borderRadius: "var(--r-md)",
                                fontFamily: "var(--font-sans)",
                                outline: "none",
                                textAlign: "center",
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <label
                              style={{
                                fontSize: ".8125rem",
                                fontWeight: 600,
                                color: "var(--ink-700)",
                                display: "block",
                                marginBottom: 6,
                              }}
                            >
                              Sale price (Rs.)
                            </label>
                            <input
                              value={salePrice}
                              onChange={(e) => setSalePrice(e.target.value.replace(/[^\d.]/g, ""))}
                              inputMode="numeric"
                              placeholder="e.g. 960"
                              className="tnum"
                              style={{
                                width: "100%",
                                height: 48,
                                padding: "0 12px",
                                border: "1px solid var(--line-200)",
                                borderRadius: "var(--r-md)",
                                fontFamily: "var(--font-sans)",
                                outline: "none",
                                textAlign: "center",
                              }}
                            />
                          </div>
                        )}

                        <p
                          style={{
                            margin: "10px 0 0",
                            fontSize: ".8125rem",
                            color: saleValid ? "var(--ink-600)" : "var(--danger, #d23)",
                          }}
                        >
                          {!saleValid
                            ? saleMode === "percent"
                              ? "Enter a percentage between 1 and 99."
                              : "Sale price must be a positive number below the regular price."
                            : `Buyers pay ${formatNPR(saleEffectivePrice)} ` +
                              `(was ${formatNPR(baseNum)}, −${
                                baseNum > 0
                                  ? Math.round((1 - saleEffectivePrice / baseNum) * 100)
                                  : 0
                              }%).`}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <h4
                    style={{
                      margin: "0 0 4px",
                      fontSize: ".9375rem",
                      fontWeight: 600,
                      color: "var(--ink-800)",
                    }}
                  >
                    What's different between versions?
                  </h4>
                  <p style={{ margin: "0 0 12px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                    Pick what changes — like colour or size — then add the choices. The price list
                    below updates on its own as you go.
                  </p>

                  {/* Quick-add option types */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {variantOptionButtons.map((preset) => {
                      const already =
                        preset !== "Custom" &&
                        variantGroupDefs.some(
                          (g) => g.name.trim().toLowerCase() === preset.toLowerCase(),
                        );
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addPresetAttribute(preset)}
                          disabled={already}
                          style={{
                            height: 36,
                            padding: "0 14px",
                            borderRadius: "var(--r-full)",
                            border: "1px solid var(--line-200)",
                            background: already ? "var(--bg-100)" : "#fff",
                            color: already ? "var(--ink-400)" : "var(--ink-700)",
                            fontWeight: 600,
                            fontSize: ".8125rem",
                            cursor: already ? "default" : "pointer",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          + {preset}
                        </button>
                      );
                    })}
                  </div>

                  {/* Option (attribute) cards */}
                  {variantGroupDefs.length === 0 ? (
                    <p style={{ margin: "0 0 6px", fontSize: ".8125rem", color: "var(--ink-400)" }}>
                      Pick an option type above to start building variants.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      {variantGroupDefs.map((group) => {
                        const presets = VARIANT_VALUE_PRESETS[group.name.trim()] ?? [];
                        const currentValues = group.options
                          .map((o) => o.trim())
                          .filter((o, i, arr) => o && arr.indexOf(o) === i);
                        const unusedPresets = presets.filter(
                          (p) => !currentValues.some((v) => v.toLowerCase() === p.toLowerCase()),
                        );
                        return (
                          <div
                            key={group.id}
                            style={{
                              border: "1px solid var(--line-200)",
                              borderRadius: "var(--r-md)",
                              padding: "10px 12px",
                              background: "var(--line-100)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <input
                                value={group.name}
                                onChange={(e) => updateGroupName(group.id, e.target.value)}
                                placeholder="Option name (e.g. Color, Size)"
                                style={{
                                  flex: 1,
                                  height: 38,
                                  padding: "0 10px",
                                  border: "1px solid var(--line-200)",
                                  borderRadius: "var(--r-md)",
                                  fontFamily: "var(--font-sans)",
                                  fontWeight: 600,
                                  outline: "none",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeGroupDef(group.id)}
                                aria-label="Remove option"
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "var(--r-md)",
                                  border: "1px solid var(--line-200)",
                                  background: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                <SellerIcon name="trash" size={14} color="var(--danger)" />
                              </button>
                            </div>

                            {/* Current choices */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                marginBottom: currentValues.length ? 8 : 0,
                              }}
                            >
                              {currentValues.length ? (
                                currentValues.map((value) => (
                                  <span
                                    key={value}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "4px 6px 4px 10px",
                                      borderRadius: "var(--r-full)",
                                      background: "#fff",
                                      border: "1px solid var(--line-200)",
                                      fontSize: ".8125rem",
                                      fontWeight: 600,
                                      color: "var(--ink-700)",
                                    }}
                                  >
                                    {value}
                                    <button
                                      type="button"
                                      onClick={() => removeAttributeValue(group.id, value)}
                                      aria-label={`Remove ${value}`}
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: "50%",
                                        border: "none",
                                        background: "var(--bg-100)",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                      }}
                                    >
                                      <SellerIcon name="x" size={11} color="var(--ink-500)" />
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
                                  No choices yet.
                                </span>
                              )}
                            </div>

                            {/* One-tap preset choices */}
                            {unusedPresets.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 6,
                                  marginBottom: 8,
                                }}
                              >
                                {unusedPresets.map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => addAttributeValue(group.id, value)}
                                    style={{
                                      height: 28,
                                      padding: "0 10px",
                                      borderRadius: "var(--r-full)",
                                      border: "1.5px dashed var(--line-300)",
                                      background: "transparent",
                                      fontSize: ".75rem",
                                      fontWeight: 600,
                                      color: "var(--ink-500)",
                                      cursor: "pointer",
                                    }}
                                  >
                                    + {value}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Add a custom choice */}
                            <div style={{ display: "flex", gap: 6 }}>
                              <input
                                ref={(el) => {
                                  choiceInputRefs.current[group.id] = el;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    submitChoiceInput(group.id);
                                  }
                                }}
                                placeholder="Add a choice, e.g. Red"
                                style={{
                                  flex: 1,
                                  height: 34,
                                  padding: "0 10px",
                                  border: "1px solid var(--line-200)",
                                  borderRadius: "var(--r-md)",
                                  fontFamily: "var(--font-sans)",
                                  fontSize: ".8125rem",
                                  outline: "none",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => submitChoiceInput(group.id)}
                                style={{
                                  height: 34,
                                  padding: "0 12px",
                                  border: "1px solid var(--line-200)",
                                  borderRadius: "var(--r-md)",
                                  background: "#fff",
                                  fontSize: ".75rem",
                                  fontWeight: 600,
                                  color: "var(--ink-600)",
                                  cursor: "pointer",
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* No "regenerate" button — the price list below rebuilds itself
                    whenever options or choices change (see syncMultiVariants). The
                    only escape hatch is a quiet "Reset table" link under it. */}

                  {/* Photos for each version — defaults to one shared photo, with the
                    other photo modes tucked away until the seller asks for them. */}
                  {variants.length > 0 && (
                    <div
                      style={{
                        border: "1px solid var(--line-200)",
                        borderRadius: "var(--r-md)",
                        padding: 12,
                        marginBottom: 14,
                        background: "#fff",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: ".8125rem",
                          fontWeight: 600,
                          color: "var(--ink-700)",
                        }}
                      >
                        Photos for each version
                      </p>

                      {!photoOptionsExpanded ? (
                        <p style={{ margin: 0, fontSize: ".8125rem", color: "var(--ink-500)" }}>
                          All versions use your main photo.{" "}
                          <button
                            type="button"
                            onClick={() => setShowPhotoOptions(true)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              fontWeight: 600,
                              color: "var(--blue-deep)",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                              fontSize: ".8125rem",
                            }}
                          >
                            Want different photos? Choose below.
                          </button>
                        </p>
                      ) : (
                        <>
                          <p
                            style={{
                              margin: "0 0 10px",
                              fontSize: ".75rem",
                              color: "var(--ink-500)",
                            }}
                          >
                            Pick how photos work. Each version falls back to its own photo first,
                            then its colour photo, then your main photo.
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {(
                              [
                                [
                                  "product",
                                  "Same photo for all",
                                  "Every version shows your main product photo.",
                                ],
                                [
                                  "option",
                                  optionPhotoLabel,
                                  "Add one photo per choice — it shows on every matching version.",
                                ],
                                [
                                  "exact",
                                  "A different photo for each version",
                                  "Upload a separate photo for every version in the list below.",
                                ],
                              ] as const
                            ).map(([mode, label, desc]) => {
                              const selected = variantImageMode === mode;
                              return (
                                <label
                                  key={mode}
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "flex-start",
                                    padding: "10px 12px",
                                    borderRadius: "var(--r-md)",
                                    border: selected
                                      ? "1.5px solid var(--blue-deep)"
                                      : "1px solid var(--line-200)",
                                    background: selected ? "var(--tint-blue-50)" : "#fff",
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="variantImageMode"
                                    checked={selected}
                                    onChange={() => {
                                      setVariantImageMode(mode);
                                      if (mode === "option")
                                        setOptionImageAttr(activeOptionImageAttr);
                                    }}
                                    style={{ marginTop: 2, accentColor: "var(--blue-deep)" }}
                                  />
                                  <span>
                                    <span
                                      style={{
                                        display: "block",
                                        fontSize: ".8125rem",
                                        fontWeight: 600,
                                        color: "var(--ink-800)",
                                      }}
                                    >
                                      {label}
                                    </span>
                                    <span
                                      style={{
                                        display: "block",
                                        fontSize: ".75rem",
                                        color: "var(--ink-500)",
                                      }}
                                    >
                                      {desc}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {variantImageMode === "option" && (
                            <div style={{ marginTop: 12 }}>
                              <label
                                style={{
                                  display: "block",
                                  fontSize: ".75rem",
                                  fontWeight: 600,
                                  color: "var(--ink-600)",
                                  marginBottom: 6,
                                }}
                              >
                                Image changes by
                              </label>
                              <select
                                value={activeOptionImageAttr}
                                onChange={(e) => setOptionImageAttr(e.target.value)}
                                style={{
                                  width: "100%",
                                  height: 44,
                                  padding: "0 12px",
                                  border: "1px solid var(--line-200)",
                                  borderRadius: "var(--r-md)",
                                  background: "#fff",
                                  fontFamily: "var(--font-sans)",
                                  marginBottom: 10,
                                }}
                              >
                                {variantAttributeNames.length ? (
                                  variantAttributeNames.map((name) => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))
                                ) : (
                                  <option value="">Add an option first</option>
                                )}
                              </select>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {optionImageValues.length ? (
                                  optionImageValues.map((value) => {
                                    const key = optionImageKey(activeOptionImageAttr, value);
                                    const url = optionImageUrls[key];
                                    const uploading = optionImageUploading[key];
                                    return (
                                      <div
                                        key={value}
                                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                                      >
                                        <span
                                          style={{
                                            flex: 1,
                                            fontSize: ".8125rem",
                                            fontWeight: 600,
                                            color: "var(--ink-700)",
                                          }}
                                        >
                                          {activeOptionImageAttr}: {value}
                                        </span>
                                        <label
                                          title={`Photo for ${value}`}
                                          style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "var(--r-sm)",
                                            border: "1.5px dashed var(--line-300)",
                                            background: url ? "transparent" : "var(--bg-50)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                          }}
                                        >
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file)
                                                void handleOptionImageUpload(
                                                  activeOptionImageAttr,
                                                  value,
                                                  file,
                                                );
                                              e.target.value = "";
                                            }}
                                          />
                                          {uploading ? (
                                            <Spinner size={14} />
                                          ) : url ? (
                                            <img
                                              src={url}
                                              alt=""
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                              }}
                                            />
                                          ) : (
                                            <SellerIcon
                                              name="camera"
                                              size={16}
                                              color="var(--ink-400)"
                                            />
                                          )}
                                        </label>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: ".75rem",
                                      color: "var(--ink-400)",
                                    }}
                                  >
                                    Add choices to this option to upload images.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Auto-generated price list. Rebuilds itself as options change;
                    a bulk "set the same for all" helper sits on top, and each row
                    keeps its own price / stock. Reflows to stacked cards on
                    mobile via .bz-vtable in form-workflow.css. */}
                  {variants.length > 0 &&
                    (() => {
                      const showImg = variantImageMode !== "product";
                      // Columns live in a CSS var so the stylesheet's mobile media
                      // query can stack them without fighting an inline value.
                      const vcols = showImg
                        ? "40px minmax(0,1fr) 96px 76px"
                        : "minmax(0,1fr) 96px 76px";
                      return (
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: ".8125rem",
                              fontWeight: 600,
                              color: "var(--ink-700)",
                            }}
                          >
                            {variants.length} version{variants.length !== 1 ? "s" : ""} — set a
                            price and stock for each
                          </p>
                          <p
                            style={{
                              margin: "0 0 10px",
                              fontSize: ".75rem",
                              color: "var(--ink-400)",
                            }}
                          >
                            This list updates on its own when you change options. Edit any row
                            below.
                          </p>

                          {/* Bulk fill — one price + one stock applied to every version */}
                          <div className="bz-vbulk">
                            <span className="bz-vbulk__title">
                              Set the same price &amp; stock for all
                            </span>
                            <div className="bz-vbulk__row">
                              <input
                                value={bulkPrice}
                                onChange={(e) =>
                                  setBulkPrice(e.target.value.replace(/[^\d.]/g, ""))
                                }
                                inputMode="numeric"
                                placeholder="Price (Rs.)"
                                className="tnum bz-vbulk__input"
                                aria-label="Price for all versions"
                              />
                              <input
                                value={bulkStock}
                                onChange={(e) => setBulkStock(e.target.value.replace(/\D/g, ""))}
                                inputMode="numeric"
                                placeholder="Stock"
                                className="tnum bz-vbulk__input"
                                aria-label="Stock for all versions"
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={applyBulkPriceStock}
                                disabled={!bulkPrice.trim() && !bulkStock.trim()}
                              >
                                Apply to all
                              </Button>
                            </div>
                            <p className="bz-vbulk__hint">
                              Fills every version below — you can still change any row after.
                            </p>
                          </div>

                          <div
                            className="bz-vtable"
                            style={{ ["--bz-vcols" as string]: vcols } as React.CSSProperties}
                          >
                            <div className="bz-vrow bz-vhead">
                              {showImg && <span aria-hidden />}
                              <span>Version</span>
                              <span style={{ textAlign: "center" }}>Price (Rs.)</span>
                              <span style={{ textAlign: "center" }}>Stock</span>
                            </div>
                            {variants.map((v) => {
                              const pairs = Object.entries(v.optionValues ?? {});
                              const label = pairs.length
                                ? pairs.map(([g, o]) => `${g}: ${o}`).join(" / ")
                                : v.name;
                              const optionValueForImage = activeOptionImageAttr
                                ? (v.optionValues ?? {})[activeOptionImageAttr]
                                : undefined;
                              const optionImg = optionValueForImage
                                ? optionImageUrls[
                                    optionImageKey(activeOptionImageAttr, optionValueForImage)
                                  ]
                                : undefined;
                              return (
                                <div key={v.id} className="bz-vrow">
                                  {showImg &&
                                    (variantImageMode === "exact" ? (
                                      <label
                                        title="Photo for this version"
                                        className="bz-vrow__photo"
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: "var(--r-sm)",
                                          border: "1.5px dashed var(--line-300)",
                                          background: v.imageUrl ? "transparent" : "var(--bg-50)",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          overflow: "hidden",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: "none" }}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) void handleVariantImageUpload(v.id, file);
                                            e.target.value = "";
                                          }}
                                        />
                                        {v.uploadingImg ? (
                                          <Spinner size={12} />
                                        ) : v.imageUrl ? (
                                          <img
                                            src={v.imageUrl}
                                            alt=""
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        ) : (
                                          <SellerIcon
                                            name="camera"
                                            size={14}
                                            color="var(--ink-400)"
                                          />
                                        )}
                                      </label>
                                    ) : (
                                      <div
                                        className="bz-vrow__photo"
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: "var(--r-sm)",
                                          background: "var(--bg-50)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          overflow: "hidden",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {optionImg ? (
                                          <img
                                            src={optionImg}
                                            alt=""
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        ) : (
                                          <SellerIcon
                                            name="image"
                                            size={14}
                                            color="var(--ink-300, #ccc)"
                                          />
                                        )}
                                      </div>
                                    ))}

                                  <div className="bz-vcell">
                                    <span className="bz-vcell__lbl">Version</span>
                                    <span className="bz-vrow__name">{label}</span>
                                  </div>

                                  <div className="bz-vcell">
                                    <span className="bz-vcell__lbl">Price (Rs.)</span>
                                    <input
                                      value={v.price}
                                      onChange={(e) =>
                                        updateVariant(
                                          v.id,
                                          "price",
                                          e.target.value.replace(/[^\d.]/g, ""),
                                        )
                                      }
                                      inputMode="numeric"
                                      placeholder="0"
                                      className="tnum bz-vcell__input"
                                      style={{
                                        border: `1.5px solid ${v.price ? "var(--line-200)" : "var(--warning, #f59e0b)"}`,
                                      }}
                                    />
                                    {!v.price && (
                                      <span className="bz-vcell__hint">Add a price</span>
                                    )}
                                  </div>

                                  <div className="bz-vcell">
                                    <span className="bz-vcell__lbl">Stock</span>
                                    <input
                                      value={v.stock}
                                      onChange={(e) =>
                                        updateVariant(
                                          v.id,
                                          "stock",
                                          e.target.value.replace(/\D/g, ""),
                                        )
                                      }
                                      inputMode="numeric"
                                      placeholder="0"
                                      className="tnum bz-vcell__input"
                                      style={{
                                        border: `1.5px solid ${v.stock ? "var(--line-200)" : "var(--warning, #f59e0b)"}`,
                                      }}
                                    />
                                    {!v.stock && <span className="bz-vcell__hint">Add stock</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={resetVariantValues}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontSize: ".75rem",
                                fontWeight: 600,
                                color: "var(--ink-400)",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                              }}
                            >
                              Reset table
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              )}
            </div>
          </div>
          {/* Step 4 — Bargaining (optional) */}
          <div hidden={step !== 3}>
            <div id="sec-bargain" className="bz-form-section" aria-hidden="true" />
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--tint-blue-50)",
                    color: "var(--blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SellerIcon name="bargain" size={18} color="var(--blue)" />
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Allow bargaining?{" "}
                    <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>
                      Optional
                    </span>
                  </h3>
                </div>
                {!hasVariants && (
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bargainOk}
                      onChange={(e) => setBargainOk(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "var(--blue)" }}
                    />
                    <span
                      style={{
                        fontSize: ".75rem",
                        fontWeight: 600,
                        color: bargainOk ? "var(--blue)" : "var(--ink-400)",
                      }}
                    >
                      {bargainOk ? "ON" : "OFF"}
                    </span>
                  </label>
                )}
              </div>

              {hasVariants ? (
                <>
                  <p style={{ fontSize: ".8125rem", color: "var(--ink-500)", margin: "0 0 12px" }}>
                    Allow bargaining on each version — each can have its own lowest price.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {variants
                      .filter((v) => v.name && v.price)
                      .map((v) => {
                        const floorError = variantFloorError(v);
                        return (
                          <div
                            key={v.id}
                            style={{
                              border: `1.5px solid ${
                                floorError
                                  ? "var(--danger, #d23)"
                                  : v.allowBargaining
                                    ? "var(--blue-deep, #2563eb)"
                                    : "var(--line-200)"
                              }`,
                              borderRadius: "var(--r-md)",
                              padding: "10px 12px",
                              background: v.allowBargaining
                                ? "var(--tint-blue-50, #eff6ff)"
                                : "#fff",
                            }}
                          >
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(v.allowBargaining)}
                                onChange={(e) =>
                                  updateVariant(v.id, "allowBargaining", e.target.checked)
                                }
                                style={{ width: 16, height: 16, accentColor: "var(--blue)" }}
                              />
                              <span style={{ fontWeight: 600, fontSize: ".875rem", flex: 1 }}>
                                {v.name}
                              </span>
                              <span
                                className="tnum"
                                style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}
                              >
                                {formatNPR(Number(v.price))}
                              </span>
                            </label>
                            {v.allowBargaining && (
                              <div style={{ marginTop: 8, paddingLeft: 26 }}>
                                <label
                                  style={{
                                    fontSize: ".75rem",
                                    color: "var(--ink-600)",
                                    display: "block",
                                    marginBottom: 4,
                                  }}
                                >
                                  Min. price (Rs.)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  placeholder="e.g. 800"
                                  value={v.minimumPrice ?? ""}
                                  onChange={(e) =>
                                    updateVariant(v.id, "minimumPrice", e.target.value)
                                  }
                                  aria-invalid={floorError ? true : undefined}
                                  style={{
                                    width: "100%",
                                    maxWidth: 200,
                                    padding: "8px 10px",
                                    border: `1.5px solid ${floorError ? "var(--danger, #d23)" : "var(--line-200)"}`,
                                    borderRadius: "var(--r-md)",
                                    fontSize: ".8125rem",
                                  }}
                                />
                                <span
                                  style={{
                                    display: "block",
                                    marginTop: 4,
                                    fontSize: ".72rem",
                                    color: floorError ? "var(--danger, #d23)" : "var(--ink-400)",
                                  }}
                                >
                                  {floorError ??
                                    `Set a floor below ${formatNPR(variantListedPrice(v))}`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <p style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 8 }}>
                    Offers below the min price are declined automatically. Offers at or above it
                    come to you to accept, counter, or decline. Buyers never see this limit.
                  </p>
                </>
              ) : (
                bargainOk && (
                  <>
                    <label
                      style={{
                        fontSize: ".8125rem",
                        color: "var(--ink-700)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Lowest price you'll accept (Rs.)
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 800"
                      value={bargainMinPrice}
                      aria-invalid={!bargainFloorOk ? true : undefined}
                      onChange={(e) => setBargainMinPrice(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: `1px solid ${bargainFloorOk || !submitAttempted ? "var(--line-200)" : "var(--danger)"}`,
                        borderRadius: "var(--r-md)",
                        fontSize: ".875rem",
                      }}
                    />
                    {!bargainFloorOk && submitAttempted && (
                      <p style={{ fontSize: ".75rem", color: "var(--danger)", margin: "6px 0 0" }}>
                        {!bargainMinPrice || Number(bargainMinPrice) <= 0
                          ? "Required — set a lowest price below the listed price."
                          : `Must be less than ${formatNPR(productListedPrice)}.`}
                      </p>
                    )}
                    <p style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 4 }}>
                      Offers below this price are declined automatically. Offers at or above it come
                      to you to accept, counter, or decline. Buyers never see this limit.
                    </p>
                  </>
                )
              )}
            </div>

            {/* Review */}
          </div>
          <div hidden={step !== 4}>
            <div id="sec-review" className="bz-form-section" aria-hidden="true" />
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: canPublish ? "var(--success)" : "var(--blue)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }}
                >
                  {canPublish ? <SellerIcon name="check" size={18} color="#fff" /> : 5}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                    Review &amp; {isEdit ? "save" : "publish"}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                    One last look before {isEdit ? "saving your changes" : "your product goes live"}
                    .
                  </p>
                </div>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  margin: "0 0 18px",
                  padding: 0,
                  display: "grid",
                  gap: 8,
                }}
              >
                {publishChecks.map((c) => (
                  <li key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: c.ok
                          ? "color-mix(in srgb, var(--success) 14%, #fff)"
                          : "var(--line-100)",
                        color: c.ok ? "var(--success)" : "var(--ink-400)",
                      }}
                    >
                      {c.ok ? (
                        <SellerIcon name="check" size={13} />
                      ) : (
                        <SellerIcon name="clock" size={12} />
                      )}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: ".875rem",
                        color: c.ok ? "var(--ink-700)" : "var(--ink-500)",
                        fontWeight: c.ok ? 500 : 600,
                      }}
                    >
                      {c.label}
                    </span>
                    {!c.ok && (
                      <button
                        type="button"
                        onClick={() => goToSection(c.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "var(--blue)",
                          cursor: "pointer",
                          fontSize: ".8125rem",
                          fontWeight: 600,
                        }}
                      >
                        Add
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--line-200)",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--line-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {mainPhoto[0] ? (
                    <img
                      src={mainPhoto[0].previewUrl}
                      alt="Main product"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <SellerIcon name="image" size={24} color="var(--ink-300)" />
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 200,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "10px 18px",
                  }}
                >
                  {[
                    { label: "Title", value: title || "—", id: "sec-basics" },
                    { label: "Category", value: categoryMeta?.en || "—", id: "sec-basics" },
                    { label: "Gallery photos", value: `${galleryPhotos.length}`, id: "sec-media" },
                    {
                      label: "Variants",
                      value: hasVariants ? `${variants.length}` : "Single product",
                      id: "sec-variants",
                    },
                    { label: "Price", value: reviewPriceRange, id: "sec-variants" },
                    { label: "Total stock", value: `${reviewTotalStock}`, id: "sec-variants" },
                    { label: "Photo mode", value: imageModeLabel, id: "sec-variants" },
                    {
                      label: "Warranty",
                      value: warrantyAvailable
                        ? `${warrantyMonths || "?"} mo${warrantyType ? ` · ${warrantyType}` : ""}`
                        : "None",
                      id: "sec-basics",
                    },
                    { label: "Brand", value: brand || "—", id: "sec-basics" },
                  ].map((r) => (
                    <div key={r.label}>
                      <div
                        style={{
                          fontSize: ".6875rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          color: "var(--ink-400)",
                        }}
                      >
                        {r.label}
                      </div>
                      <button
                        type="button"
                        onClick={() => goToSection(r.id)}
                        title="Edit this section"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          font: "inherit",
                          textAlign: "left",
                          color: "var(--ink-900)",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {r.value}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {!canPublish && (
                <p style={{ margin: "12px 0 0", fontSize: ".8125rem", color: "var(--danger)" }}>
                  {validationItems.length} field{validationItems.length === 1 ? "" : "s"} still need
                  attention — press {isEdit ? "Update" : "Publish"} to see the list.
                </p>
              )}
            </div>
          </div>

          <FormActionBar
            left={
              draftEnabled ? (
                <Button
                  size="sm"
                  variant="ghost"
                  icon="copy"
                  onClick={() => {
                    // Don't save an empty shell — photos alone aren't persisted
                    // to the draft, and a contentless draft would never surface
                    // in Inventory. Same predicate that gates the Inventory card,
                    // so the two can't disagree.
                    const next = buildDraft();
                    if (!productDraftHasContent(next)) {
                      toast("Fill in a product detail before saving a draft", "warning");
                      return;
                    }
                    draft.write(next);
                    toast("Draft saved — find it in your Inventory to continue");
                  }}
                >
                  Save draft
                </Button>
              ) : undefined
            }
            right={
              <>
                {step > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="chevronLeft"
                    onClick={() => goToNav(step - 1)}
                  >
                    Back
                  </Button>
                )}
                {step < navIds.length - 1 ? (
                  <Button
                    size="md"
                    variant="primary"
                    iconRight="chevronRight"
                    disabled={!canAdvance}
                    onClick={() => goToNav(step + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button size="md" variant="primary" loading={publishing} onClick={attemptPublish}>
                    {isEdit
                      ? publishing
                        ? "Saving…"
                        : "Update product"
                      : publishing
                        ? "Publishing…"
                        : "Publish"}
                  </Button>
                )}
              </>
            }
          />
        </div>

        {/* Right gutter — sticky live preview + publish checklist. On ≤1100 this
           drops beneath the form, on ≤980 it stacks under the strip rail (see
           form-workflow.css). Pure read-out of the form state; no inputs here. */}
        <aside className="bz-seller-add-preview" aria-label="Live preview">
          <div
            className="bz-seller-add-livepreview"
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 14px",
                borderBottom: "1px solid var(--line-100)",
              }}
            >
              <SellerIcon name="eye" size={15} color="var(--ink-500)" />
              <span style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
                Live preview
              </span>
              <span style={{ fontSize: ".6875rem", color: "var(--ink-400)", marginLeft: "auto" }}>
                How buyers see it
              </span>
            </div>
            <div style={{ padding: 14 }}>
              <ProductCard p={previewProduct} onClick={() => {}} preview />
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
                Publish checklist
              </span>
              <span
                className="tnum"
                style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--ink-500)" }}
              >
                {publishChecks.filter((c) => c.ok).length}/{publishChecks.length}
              </span>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
              {publishChecks.map((c) => (
                <li key={c.label}>
                  <button
                    type="button"
                    onClick={() => goToSection(c.id)}
                    title="Go to this step"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: 0,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: c.ok
                          ? "color-mix(in srgb, var(--success) 14%, #fff)"
                          : "var(--line-100)",
                        color: c.ok ? "var(--success)" : "var(--ink-400)",
                      }}
                    >
                      {c.ok ? (
                        <SellerIcon name="check" size={11} />
                      ) : (
                        <SellerIcon name="clock" size={10} />
                      )}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: ".8125rem",
                        color: c.ok ? "var(--ink-600)" : "var(--ink-700)",
                        fontWeight: c.ok ? 500 : 600,
                      }}
                    >
                      {c.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
