import { create } from "zustand";

// The one toast system for the whole app. Call sites use the `toast` singleton
// below (toast.success / .error / .warning / .info / .bargain); <ToastContainer />
// — mounted once at the app root — renders whatever the store holds. Keeping the
// state in a module-level store (not React context) lets any code fire a toast
// without threading a callback through props.

export type ToastVariant = "success" | "error" | "warning" | "info" | "bargain";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Optional one short line under the title. */
  message?: string;
  /** Renders an inline button (e.g. "Undo") instead of a confirm dialog. */
  action?: ToastAction;
  /** ms before auto-dismiss; 0 = persists until dismissed. Defaults per variant. */
  duration?: number;
}

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  /** The outcome in plain words ("Added to cart"). */
  title: string;
  message?: string;
  action?: ToastAction;
  duration: number;
}

// Errors persist (0) so the buyer can read/act before dismissing; the rest clear
// themselves. Warnings linger longest because they usually need a decision.
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 0,
  warning: 6000,
  info: 4000,
  bargain: 5000,
};

// Icon per status — names resolve against the shared kit ICON_PATHS pack.
export const TOAST_ICON: Record<ToastVariant, string> = {
  success: "check",
  error: "alertCircle",
  warning: "alertTriangle",
  info: "infoCircle",
  bargain: "discount2",
};

// Identity for dedupe: the same outcome firing twice (double-tap, retry) should
// refresh the existing toast, not stack a duplicate.
const toastKey = (t: Pick<ToastItem, "variant" | "title" | "message">) =>
  `${t.variant}|${t.title}|${t.message ?? ""}`;

let seq = 0;

interface ToastStore {
  toasts: ToastItem[];
  push: (input: Omit<ToastItem, "id">) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (input) => {
    const id = ++seq;
    set((s) => {
      const key = toastKey(input);
      // Drop any matching toast first so a repeat moves to the top with a fresh
      // timer rather than piling up.
      const rest = s.toasts.filter((t) => toastKey(t) !== key);
      return { toasts: [...rest, { ...input, id }] };
    });
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

function show(variant: ToastVariant, title: string, options: ToastOptions = {}): number {
  return useToastStore.getState().push({
    variant,
    title,
    message: options.message,
    action: options.action,
    duration: options.duration ?? DEFAULT_DURATION[variant],
  });
}

export const toast = {
  success: (title: string, options?: ToastOptions) => show("success", title, options),
  error: (title: string, options?: ToastOptions) => show("error", title, options),
  warning: (title: string, options?: ToastOptions) => show("warning", title, options),
  info: (title: string, options?: ToastOptions) => show("info", title, options),
  bargain: (title: string, options?: ToastOptions) => show("bargain", title, options),
  /** Programmatically dismiss a toast by the id returned from a fire call. */
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};

export type Toast = typeof toast;
