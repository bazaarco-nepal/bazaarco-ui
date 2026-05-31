/** Format user-visible labels from API / auth data (no mock fallbacks). */

export function displayName(
  user?: { name?: string | null; username?: string | null } | null,
  fallback = "there",
): string {
  const name = user?.name?.trim() || user?.username?.trim();
  return name || fallback;
}

export function userInitial(
  user?: { name?: string | null; username?: string | null; email?: string | null } | null,
): string {
  const base = user?.name?.trim() || user?.username?.trim() || user?.email?.trim() || "?";
  return base.charAt(0).toUpperCase();
}

export function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  if (local.length <= 2) return `${local}…@${domain}`;
  return `${local.slice(0, 2)}…${local.slice(-1)}@${domain}`;
}
