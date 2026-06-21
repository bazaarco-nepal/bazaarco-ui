"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/kit";
import { TOAST_ICON, useToastStore, type ToastItem } from "@/lib/toast";

// Newest on top, at most three on screen at once; anything beyond that waits in
// the store and surfaces as the visible ones dismiss.
const MAX_VISIBLE = 3;
const EXIT_MS = 180;

/** Mounted once at the app root. Renders whatever the toast store holds. */
export function ToastContainer() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  // store appends newest last; show the most recent three, newest first.
  const visible = toasts.slice(-MAX_VISIBLE).reverse();

  return (
    <div className="bz-toast-container" role="region" aria-label={t("common.a11y.notifications")}>
      {visible.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { t } = useTranslation();
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);

  // Auto-dismiss timing lives here (not the store) because pause-on-hover is a
  // view concern. remainingRef tracks time left so hover can pause and resume.
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(toast.duration);
  const startedAtRef = useRef(0);
  const closingRef = useRef(false);

  const isError = toast.variant === "error";
  const autoDismiss = toast.duration > 0;

  const beginExit = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setLeaving(true);
    exitTimer.current = setTimeout(onDismiss, EXIT_MS);
  }, [onDismiss]);

  const startCountdown = useCallback(() => {
    if (!autoDismiss || closingRef.current) return;
    startedAtRef.current = Date.now();
    dismissTimer.current = setTimeout(beginExit, remainingRef.current);
  }, [autoDismiss, beginExit]);

  const pause = useCallback(() => {
    if (!autoDismiss || closingRef.current) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    remainingRef.current -= Date.now() - startedAtRef.current;
    setPaused(true);
  }, [autoDismiss]);

  const resume = useCallback(() => {
    if (!autoDismiss || closingRef.current) return;
    setPaused(false);
    startCountdown();
  }, [autoDismiss, startCountdown]);

  useEffect(() => {
    startCountdown();
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [startCountdown]);

  return (
    <div
      className={`bz-toast bz-toast--${toast.variant} ${leaving ? "bz-toast--leave" : "bz-toast--enter"}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      style={{ ["--duration" as string]: `${toast.duration}ms` }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onKeyDown={(e) => {
        if (e.key === "Escape") beginExit();
      }}
    >
      <span className="bz-toast__chip" aria-hidden="true">
        <Icon name={TOAST_ICON[toast.variant]} size={14} stroke={2.2} />
      </span>
      <div className="bz-toast__body">
        <div className="bz-toast__title">{toast.title}</div>
        {toast.message && <div className="bz-toast__msg">{toast.message}</div>}
      </div>
      {toast.action && (
        <button
          type="button"
          className="bz-toast__action"
          onClick={() => {
            toast.action?.onClick();
            beginExit();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className="bz-toast__close"
        aria-label={t("common.a11y.dismissNotification")}
        onClick={beginExit}
      >
        <Icon name="x" size={15} stroke={2} />
      </button>
      {autoDismiss && (
        <div
          className="bz-toast__progress"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        />
      )}
    </div>
  );
}
