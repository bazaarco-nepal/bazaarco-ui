import type { AuthIntent } from "@/types/auth";

const STORAGE_KEY = "bz_role_v1";

/**
 * Last-known signed-in role, persisted across page loads. The real identity
 * lives in a server session cookie, so a cold load starts out not knowing who
 * the user is until the `/me` probe resolves. This hint lets us avoid flashing
 * the buyer homepage to a returning seller during that probe: we hold a neutral
 * loader for a known seller until the session settles and the role guard
 * redirects them to the dashboard. It is only a hint — the server probe is
 * still the source of truth and corrects it.
 */
export function readRoleHint(): AuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "seller" || raw === "buyer" ? raw : null;
  } catch {
    return null;
  }
}

export function writeRoleHint(role: AuthIntent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearRoleHint(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
