// The buyer's contact phone. There is no backend profile-phone field yet, so we
// keep a single client-side source of truth (persisted to localStorage) that both
// the profile screen and checkout read and write. Entering it in one place makes
// it appear in the other.

const STORAGE_KEY = "bz_buyer_phone_v1";

/** Strip to digits and keep at most a 10-digit Nepal mobile. */
export function normalizePhone(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

export function readPhoneFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return normalizePhone(localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

export function writePhoneToStorage(phone: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, normalizePhone(phone));
  } catch {
    /* ignore quota / private mode */
  }
}
