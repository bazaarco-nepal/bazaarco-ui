"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { useBazaarStore } from "@/store/bazaar-store";
import type { Locale } from "@/i18n";

// Each option shows its language in its OWN script (endonym), so a buyer who
// can't read the current UI language can still recognise and pick theirs — the
// standard for language switchers. These are proper names, not UI copy.
const OPTIONS: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: "en", label: "English" },
  { value: "ne", label: "नेपाली" },
];

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const locale = useBazaarStore((s) => s.locale);
  const setLocale = useBazaarStore((s) => s.setLocale);

  // Drive the sliding thumb from the active index (0 = EN, 1 = ने). Styling and
  // the slide animation live in CSS (.bz-lang-toggle) so both skins and
  // prefers-reduced-motion are handled in one place.
  const activeIndex = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === locale),
  );

  return (
    <div
      role="group"
      aria-label={t("language.switchAria")}
      className={"bz-lang-toggle" + (compact ? " bz-lang-toggle--compact" : "")}
      style={{ "--bz-lang-active": activeIndex } as CSSProperties}
    >
      <span className="bz-lang-toggle__thumb" aria-hidden="true" />
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className="bz-lang-toggle__opt"
          onClick={() => {
            if (o.value !== locale) setLocale(o.value);
          }}
          aria-pressed={o.value === locale}
          lang={o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
