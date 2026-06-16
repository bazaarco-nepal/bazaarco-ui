"use client";

/* ============================================================
   Reusable guided-form workflow primitives (frontend-only).
   ------------------------------------------------------------
   Used by long seller forms (Add / Edit Product) to add a
   section navigator with progress, a sticky action bar, Fluent
   message bars, field tooltips and a local-draft autosave hook.

   These are presentation + local-UI-state only. They never touch
   API calls, payloads, validation rules or business logic — the
   host form keeps full ownership of its state and submit handler.
   ============================================================ */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Button } from "@/components/ui";

/* ---------- Section progress ---------- */

export type SectionState = "todo" | "active" | "done" | "error";

export interface FormSection {
  id: string;
  label: string;
  hint?: string;
  state: SectionState;
}

const SECTION_VISUAL: Record<
  SectionState,
  { icon: string; color: string; label: string }
> = {
  todo: { icon: "clock", color: "var(--ink-300)", label: "Not started" },
  active: { icon: "edit", color: "var(--blue)", label: "In progress" },
  done: { icon: "check", color: "var(--success)", label: "Complete" },
  error: { icon: "flag", color: "var(--danger)", label: "Needs attention" },
};

/* Sticky section navigator. Desktop: a left rail. Mobile: a horizontal
   scroll strip. Clicking a section jumps the host form to its anchor. */
export function FormSectionNav({
  sections,
  activeId,
  onJump,
}: {
  sections: FormSection[];
  activeId?: string;
  onJump: (id: string) => void;
}) {
  return (
    <nav className="bz-form-nav" aria-label="Form sections">
      <div className="bz-form-nav__inner">
        {sections.map((s, i) => {
          const v = SECTION_VISUAL[s.state];
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              className={"bz-form-nav__item" + (isActive ? " is-active" : "")}
              onClick={() => onJump(s.id)}
              aria-current={isActive ? "step" : undefined}
              title={`${s.label} — ${v.label}`}
            >
              <span className="bz-form-nav__num" style={{ color: v.color, borderColor: v.color }}>
                {s.state === "done" ? (
                  <Icon name="check" size={13} color="var(--success)" />
                ) : s.state === "error" ? (
                  <Icon name="flag" size={12} color="var(--danger)" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="bz-form-nav__label">
                <span className="bz-form-nav__name">{s.label}</span>
                <span className="bz-form-nav__state" style={{ color: v.color }}>
                  {v.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Sticky bottom action bar ---------- */

export function FormActionBar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="bz-form-actionbar" role="toolbar" aria-label="Form actions">
      <div className="bz-form-actionbar__inner">
        <div className="bz-form-actionbar__left">{left}</div>
        <div className="bz-form-actionbar__right">{right}</div>
      </div>
    </div>
  );
}

/* ---------- Fluent message bar ---------- */

export type MessageTone = "info" | "warning" | "error" | "success";

const TONE: Record<MessageTone, { accent: string; bg: string; icon: string }> = {
  info: { accent: "var(--blue)", bg: "var(--tint-blue-50)", icon: "bell" },
  warning: { accent: "var(--warning)", bg: "#fff8f0", icon: "flag" },
  error: { accent: "var(--danger)", bg: "var(--tint-red-50)", icon: "flag" },
  success: { accent: "var(--success)", bg: "#f1faf1", icon: "badgeCheck" },
};

export function MessageBar({
  tone = "info",
  title,
  children,
  actions,
  onDismiss,
}: {
  tone?: MessageTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onDismiss?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: t.bg,
        borderInlineStart: `3px solid ${t.accent}`,
        border: "1px solid var(--line-200)",
        borderInlineStartWidth: 3,
        borderRadius: "var(--r-md)",
        padding: "10px 12px",
        marginBottom: 14,
      }}
    >
      <Icon name={t.icon} size={18} color={t.accent} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontWeight: 700, fontSize: ".875rem", color: "var(--ink-900)" }}>
            {title}
          </div>
        )}
        {children && (
          <div style={{ fontSize: ".8125rem", color: "var(--ink-700)", lineHeight: 1.5 }}>
            {children}
          </div>
        )}
        {actions && <div style={{ display: "flex", gap: 8, marginTop: 8 }}>{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-400)",
            padding: 2,
            lineHeight: 0,
          }}
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

/* ---------- Field tooltip ---------- */

/* A small "i" affordance that reveals helper text on hover/focus. Falls back
   to the native `title` for assistive tech and no-JS contexts. */
export function InfoTip({ text, label = "More info" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", verticalAlign: "middle", marginInlineStart: 6 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        title={text}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          width: 15,
          height: 15,
          borderRadius: "50%",
          background: "var(--ink-300)",
          color: "#fff",
          border: "none",
          padding: 0,
          cursor: "help",
          fontSize: 10,
          fontWeight: 700,
          fontStyle: "italic",
          lineHeight: "15px",
          fontFamily: "Georgia, serif",
        }}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            insetInlineStart: "50%",
            transform: "translateX(-50%)",
            width: 220,
            background: "var(--ink-900)",
            color: "#fff",
            fontSize: ".75rem",
            lineHeight: 1.45,
            fontWeight: 400,
            padding: "8px 10px",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-2)",
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

/* ---------- Local draft autosave (frontend-only) ---------- */

/* A thin localStorage wrapper. The host form decides WHAT to snapshot; this
   only persists/loads/clears it. Never a substitute for the real backend save. */
export function useLocalDraft<T>(key: string) {
  const read = useCallback((): T | null => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [key]);

  const write = useCallback(
    (value: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* quota / private mode — drafts are best-effort */
      }
    },
    [key],
  );

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  const exists = useCallback(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(key) != null;
    } catch {
      return false;
    }
  }, [key]);

  return { read, write, clear, exists };
}

/* ---------- Scroll spy ---------- */

/* Highlights the section currently in view. `rootId` is the scroll container
   (the seller shell scrolls inside #app-scroll, not the window). */
export function useScrollSpy(ids: string[], rootId?: string): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const idsKey = ids.join("|");
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const root = (rootId && document.getElementById(rootId)) || null;
    const scroller: HTMLElement | Window = root ?? window;

    const compute = () => {
      frame.current = null;
      const viewportTop = root ? root.getBoundingClientRect().top : 0;
      let current: string | undefined = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        // First section whose top is at/above the reference line wins; the last
        // one that has passed the line is the active one.
        if (el.getBoundingClientRect().top - viewportTop <= 120) current = id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame.current == null) frame.current = window.requestAnimationFrame(compute);
    };

    compute();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, rootId]);

  return active;
}

/* Smooth-scroll a section anchor into view inside the seller scroll container. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Re-export for hosts that compose their own action rows. */
export { Button as FormButton };
