"use client";

import React, { useEffect, useRef, useState } from "react";
import { Chip, Placeholder } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { formatNPR } from "@/shared/lib/money";
import { BuyerAvatar } from "@/components/common";
import { inboxLabel, inboxTone } from "./inbox";
import { type SellerInboxOrderItem } from "./types";

/* ---------- Shared seller chrome ---------- */

// Help lifeline removed — no floating help FAB on seller screens. Kept as a
// no-op so existing render sites stay valid.
export function SellerHelpBar() {
  return null;
}

export type Breadcrumb = { label: string; onClick?: () => void };

/* The one page header every seller screen uses: a Microsoft-style blue accent
   rail beside a dark title, a plain-language helper line, an optional breadcrumb
   for context, and a right-aligned slot for the screen's primary actions. One
   component, so the panel reads as a single product and is easy to navigate. */
export function SellerPageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: Breadcrumb[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="bz-seller-pagehead">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="bz-seller-pagehead__crumbs" aria-label="Breadcrumb">
          {breadcrumb.map((c, i) => {
            const last = i === breadcrumb.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span className="bz-seller-pagehead__crumb-sep" aria-hidden="true">
                    /
                  </span>
                )}
                {c.onClick && !last ? (
                  <button type="button" onClick={c.onClick} className="bz-hover-tint">
                    {c.label}
                  </button>
                ) : (
                  <span
                    className={last ? "bz-seller-pagehead__crumb-current" : undefined}
                    aria-current={last ? "page" : undefined}
                  >
                    {c.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}
      <div className="bz-seller-pagehead__row">
        <div className="bz-seller-pagehead__title">
          <div style={{ minWidth: 0 }}>
            <h1>{title}</h1>
            {subtitle && <p className="bz-seller-pagehead__sub">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="bz-seller-pagehead__actions">{actions}</div>}
      </div>
    </header>
  );
}

/* One consistent, borderless empty state for the whole seller panel: a soft
   icon tile + title + message (+ optional action), centered. No card/rectangle
   wrapper — it sits directly in the page so every "nothing here yet" reads the
   same. Self-contained inline styles (token-based) so it's safe in any scope. */
export function SellerEmptyState({
  icon,
  title,
  message,
  action,
  style,
}: {
  icon?: string;
  title: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        ...style,
      }}
    >
      {icon && (
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--r-lg)",
            background: "var(--tint-blue-50)",
            color: "var(--blue)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <SellerIcon name={icon} size={24} color="var(--blue)" />
        </span>
      )}
      <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--ink-900)", marginBottom: 4 }}>
        {title}
      </div>
      {message && (
        <div
          style={{
            fontSize: ".8125rem",
            color: "var(--ink-500)",
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export type SelectOption = { value: string; label: string };

/* A compact Fluent dropdown for single-select controls (e.g. the date range).
   A clean alternative to a row of buttons: one trigger that shows the current
   choice, opening a floating menu with a check on the selected option. Closes
   on outside-click or Escape; keyboard-operable. */
export function SelectMenu({
  value,
  options,
  onChange,
  icon,
  ariaLabel = "Select",
  align = "end",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: string;
  ariaLabel?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="bz-hover-border"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 36,
          padding: "0 10px 0 12px",
          background: "#fff",
          border: `1px solid ${open ? "var(--blue)" : "var(--line-200)"}`,
          borderRadius: "var(--r-md)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: ".875rem",
          fontWeight: 600,
          color: "var(--ink-700)",
          whiteSpace: "nowrap",
        }}
      >
        {icon && <SellerIcon name={icon} size={15} color="var(--ink-500)" />}
        {current?.label}
        <SellerIcon name={open ? "chevronUp" : "chevronDown"} size={14} color="var(--ink-400)" />
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            [align === "end" ? "right" : "left"]: 0,
            minWidth: 168,
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-3)",
            padding: 4,
            zIndex: 60,
          }}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  width: "100%",
                  height: 36,
                  padding: "0 10px",
                  background: selected ? "var(--tint-blue-50)" : "transparent",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: ".875rem",
                  fontWeight: selected ? 600 : 500,
                  color: selected ? "var(--blue)" : "var(--ink-700)",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = "var(--line-100)";
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = "transparent";
                }}
              >
                {o.label}
                {selected && <SellerIcon name="check" size={14} color="var(--blue)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrderCard({
  o,
  onOpen,
}: {
  o: SellerInboxOrderItem;
  onOpen: (order: SellerInboxOrderItem) => void;
}) {
  const lbl = inboxLabel(o.status);
  const tone = inboxTone(o.status);
  return (
    <button
      onClick={() => onOpen(o)}
      className="bz-hover-lift"
      style={{
        background: "#fff",
        border: `1.5px solid ${o.status === "new_order" ? "var(--blue)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        display: "flex",
        gap: 10,
      }}
    >
      {o.imageUrl ? (
        <img
          src={o.imageUrl}
          alt=""
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: "var(--r-md)",
            objectFit: "cover",
            border: "1px solid var(--line-200)",
            background: "var(--line-100)",
          }}
        />
      ) : (
        <Placeholder
          icon={o.icon}
          style={{ width: 56, height: 56, flexShrink: 0 }}
          radius="var(--r-md)"
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Chip tone={tone} size="sm" icon={lbl.icon}>
            {lbl.en}
          </Chip>
          <span style={{ fontSize: ".68rem", color: "var(--ink-400)", marginLeft: "auto" }}>
            {o.time}
          </span>
        </div>
        <div
          style={{
            fontWeight: 600,
            color: "var(--ink-900)",
            fontSize: ".875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {o.item}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 3,
            minWidth: 0,
          }}
        >
          <BuyerAvatar
            src={o.buyerAvatarUrl}
            name={o.buyer}
            size={20}
            fontSize=".7rem"
            style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
          />
          <span
            style={{
              fontSize: ".75rem",
              color: "var(--ink-500)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {o.buyer}
          </span>
        </div>
        <div
          className="tnum"
          style={{ fontSize: ".875rem", color: "var(--ink-900)", fontWeight: 600, marginTop: 4 }}
        >
          {formatNPR(o.price)}
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   Structural kit — the layout primitives every seller screen is
   built from. Shapes come from the add-product mockup; colour
   comes from the active skin (Fluent) via the .bz-* classes in
   seller-kit.css. Keep markup here and styling in CSS so the
   responsive behaviour (two-col → one, table → stacked cards)
   lives in one place.
   ============================================================ */

/* The centered content column every seller screen sits in: caps width at
   --seller-max (1160px in Fluent), centers it, and applies the standard
   gutters (28px desktop, 16px mobile via .bz-container-pad). Replaces the
   inline `maxWidth: var(--container)` wrapper that used to be copy-pasted into
   every screen. */
export function SellerPage({
  children,
  className,
  style,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  return (
    <div
      className={"bz-seller-page bz-container-pad" + (className ? " " + className : "")}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

/* A padded white surface with a hairline border + soft Fluent shadow. Pass a
   `title` to get the standard heading row (with an optional muted `label` and a
   right-aligned `action` slot); omit it to use the card as a bare container. */
export function Card({
  title,
  label,
  action,
  flat,
  children,
  className,
  style,
}: {
  title?: React.ReactNode;
  label?: React.ReactNode;
  action?: React.ReactNode;
  flat?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={
        "bz-card bz-scard" + (flat ? " bz-card--flat" : "") + (className ? " " + className : "")
      }
      style={style}
    >
      {title != null && <CardHead title={title} label={label} action={action} />}
      {children}
    </section>
  );
}

export function CardHead({
  title,
  label,
  action,
}: {
  title: React.ReactNode;
  label?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bz-card-head">
      <h3>{title}</h3>
      {label != null && <span className="bz-card-head__opt">{label}</span>}
      {action != null && <span className="bz-card-head__action">{action}</span>}
    </div>
  );
}

/* Label + control + hint with a constrained width (the mockup keeps inputs from
   going full-bleed: name ≤440, select ≤320). `width` picks the cap; controls
   inherit the shared field styling from seller-kit.css. */
export function Field({
  label,
  htmlFor,
  hint,
  required,
  width = "full",
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  required?: boolean;
  width?: "full" | "name" | "select" | "sm";
  children: React.ReactNode;
}) {
  const widthClass =
    width === "name"
      ? " bz-field--name"
      : width === "select"
        ? " bz-field--select"
        : width === "sm"
          ? " bz-field--sm"
          : "";
  return (
    <div className={"bz-field" + widthClass}>
      {label != null && (
        <label htmlFor={htmlFor}>
          {label}
          {required && <span className="bz-field__req"> · required</span>}
        </label>
      )}
      {children}
      {hint != null && <p className="bz-field__hint">{hint}</p>}
    </div>
  );
}

type SegOption = {
  value: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  icon?: string;
};

/* Segmented toggle — a 2-up row of radio-style cards for a small, mutually
   exclusive choice (e.g. "No variants / Has variants"). */
function SegToggle({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="bz-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            className={on ? "is-on" : undefined}
            onClick={() => onChange(o.value)}
          >
            <span className="bz-seg__t">
              {o.icon && <SellerIcon name={o.icon} size={18} />}
              {o.title}
            </span>
            {o.sub != null && <span className="bz-seg__s">{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

type RadioCardOption = {
  value: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  icon?: string;
};

/* Stacked single-select radio cards (e.g. variant photo mode). */
function RadioCardGroup({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            className={"bz-radio-card" + (on ? " is-on" : "")}
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => onChange(o.value)}
          >
            {o.icon && (
              <span className="bz-radio-card__ic">
                <SellerIcon name={o.icon} size={20} />
              </span>
            )}
            <span>
              <span className="bz-radio-card__t" style={{ display: "block" }}>
                {o.title}
              </span>
              {o.sub != null && <span className="bz-radio-card__s">{o.sub}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* Photo uploader tile — presentational. The host owns the actual file picking
   (it passes `onPick`) and the preview `url`; the tile shows the preview, an
   add affordance when empty, and a remove button when filled. */
function PhotoTile({
  url,
  onPick,
  onRemove,
  variant = "gallery",
  caption = "Add photo",
  ariaLabel,
}: {
  url?: string | null;
  onPick: () => void;
  onRemove?: () => void;
  variant?: "main" | "gallery";
  caption?: React.ReactNode;
  ariaLabel?: string;
}) {
  const filled = !!url;
  return (
    <button
      type="button"
      aria-label={
        ariaLabel || (filled ? "Change photo" : typeof caption === "string" ? caption : "Add photo")
      }
      className={
        "bz-tile " +
        (variant === "main" ? "bz-tile--main" : "bz-tile--gallery") +
        (filled ? " is-filled" : "")
      }
      style={filled ? { backgroundImage: `url(${url})` } : undefined}
      onClick={onPick}
    >
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Remove photo"
          className="bz-tile__rm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove();
            }
          }}
        >
          <SellerIcon name="x" size={12} />
        </span>
      )}
      {!filled && (
        <>
          <SellerIcon name="image" size={variant === "main" ? 22 : 20} />
          <span className="bz-tile__cap">{caption}</span>
        </>
      )}
    </button>
  );
}

/* Metric summary grid (review screens, KPI rows). */
export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="bz-metric-grid">{children}</div>;
}

export function Metric({
  label,
  value,
  small,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="bz-metric">
      <div className="bz-metric__k">{label}</div>
      <div className={"bz-metric__v tnum" + (small ? " is-sm" : "")}>{value}</div>
    </div>
  );
}

/* A single "before you publish" checklist row: state icon + label, with an
   optional Fix action when the item still needs attention. */
function ChecklistRow({
  label,
  done,
  onFix,
  fixLabel = "Fix",
}: {
  label: React.ReactNode;
  done: boolean;
  onFix?: () => void;
  fixLabel?: string;
}) {
  return (
    <div className="bz-check">
      <span className="bz-check__label">
        <span className={done ? "bz-check__ok" : "bz-check__todo"}>
          <SellerIcon name={done ? "badgeCheck" : "flag"} size={19} />
        </span>
        {label}
      </span>
      {!done && onFix && (
        <button
          type="button"
          onClick={onFix}
          className="bz-hover-border"
          style={{
            fontSize: ".8125rem",
            color: "var(--blue)",
            background: "transparent",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-md)",
            padding: "5px 12px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          {fixLabel}
        </button>
      )}
    </div>
  );
}

function DetailTile({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  const color =
    tone === "danger"
      ? "var(--danger)"
      : tone === "saffron"
        ? "var(--saffron)"
        : tone === "success"
          ? "var(--success)"
          : "var(--ink-900)";
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "#fff",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div
        style={{
          fontSize: ".75rem",
          fontWeight: 600,
          color: "var(--ink-500)",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: ".03em",
        }}
      >
        {label}
      </div>
      <div className="tnum" style={{ fontSize: "1.125rem", fontWeight: 600, color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

export { DetailTile };
