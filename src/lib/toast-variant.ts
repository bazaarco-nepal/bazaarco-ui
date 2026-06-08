export type ToastVariant = "success" | "error" | "info" | "warning";

const ERROR_PATTERNS = [
  /\bcould not\b/i,
  /\bfailed\b/i,
  /\berror\b/i,
  /\bunable\b/i,
  /\bdenied\b/i,
  /\binvalid\b/i,
  /\bnot approved\b/i,
  /\btry again\b/i,
  /\bdelete failed\b/i,
  /\bupload failed\b/i,
];

const INFO_PATTERNS = [
  /^please\b/i,
  /^enter\b/i,
  /^upload\b/i,
  /^choose\b/i,
  /^select\b/i,
  /^sign in\b/i,
  /^use jpeg/i,
  /^use mp4/i,
  /^coming soon/i,
  /^edit quick replies/i,
];

const WARNING_PATTERNS = [/\bwarning\b/i, /\bcaution\b/i, /^max \d+/i, /^only \d+ left/i];

export function inferToastVariant(msg: string): ToastVariant {
  const m = msg.trim();
  if (WARNING_PATTERNS.some((p) => p.test(m))) return "warning";
  if (ERROR_PATTERNS.some((p) => p.test(m))) return "error";
  if (INFO_PATTERNS.some((p) => p.test(m))) return "info";
  return "success";
}

export const TOAST_VARIANT_META: Record<
  ToastVariant,
  { icon: string; accent: string; iconBg: string; progress: string }
> = {
  success: {
    icon: "check",
    accent: "var(--success)",
    iconBg: "rgba(22, 163, 74, 0.12)",
    progress: "var(--success)",
  },
  error: {
    icon: "x",
    accent: "var(--red)",
    iconBg: "rgba(230, 57, 70, 0.1)",
    progress: "var(--red)",
  },
  info: {
    icon: "bell",
    accent: "var(--blue)",
    iconBg: "rgba(29, 78, 216, 0.1)",
    progress: "var(--blue)",
  },
  warning: {
    icon: "clock",
    accent: "var(--saffron)",
    iconBg: "rgba(247, 127, 0, 0.12)",
    progress: "var(--saffron)",
  },
};
