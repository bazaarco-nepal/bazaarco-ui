/** Set when the seller skips KYC onboarding to use the dashboard first. */
export const SELLER_ONBOARDING_DEFERRED_KEY = "bz-seller-onboarding-deferred";

export function deferSellerOnboarding(): void {
  try {
    localStorage.setItem(SELLER_ONBOARDING_DEFERRED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearDeferredSellerOnboarding(): void {
  try {
    localStorage.removeItem(SELLER_ONBOARDING_DEFERRED_KEY);
  } catch {
    /* ignore */
  }
}

export function isSellerOnboardingDeferred(): boolean {
  try {
    return localStorage.getItem(SELLER_ONBOARDING_DEFERRED_KEY) === "1";
  } catch {
    return false;
  }
}
