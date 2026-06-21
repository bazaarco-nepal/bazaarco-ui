/**
 * Label for how long an accepted bargain price stays redeemable, e.g.
 * "Expires in 22h 14m". Returns null when there's no deadline or it lapsed —
 * callers hide the label rather than show a dead countdown.
 */
export function bargainExpiryLabel(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(msLeft) || msLeft <= 0) return null;
  const totalMinutes = Math.floor(msLeft / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) return `Expires in ${hours}h ${minutes}m`;
  if (minutes >= 1) return `Expires in ${minutes}m`;
  return "Expires in under a minute";
}
