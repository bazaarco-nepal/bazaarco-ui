const STORAGE_KEY = "bazaarco:onboarded";

/** Whether the visitor has already passed the first-visit splash screen. */
export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark the splash as seen so future visits skip straight to the homepage. */
export function markOnboarded(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
