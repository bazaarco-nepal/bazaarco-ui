/** Format user-visible labels from API / auth data (no mock fallbacks). */

export function displayName(user?: { name?: string | null } | null, fallback = "there"): string {
  return user?.name?.trim() || fallback;
}

export function firstName(user?: { name?: string | null } | null, fallback = "there"): string {
  return user?.name?.trim().split(/\s+/)[0] || fallback;
}

export function userInitial(user?: { name?: string | null; email?: string | null } | null): string {
  const base = user?.name?.trim() || user?.email?.trim() || "?";
  return base.charAt(0).toUpperCase();
}

export function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  if (local.length <= 2) return `${local}…@${domain}`;
  return `${local.slice(0, 2)}…${local.slice(-1)}@${domain}`;
}
