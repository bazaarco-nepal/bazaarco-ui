import { Preferences } from "@capacitor/preferences";

const STORAGE_KEY = "bz_access_token";

let cachedToken: string | null = null;
let hydrated = false;
let hydrationPromise: Promise<string | null> | null = null;

function takeLegacyToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const token =
      window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return token;
  } catch {
    return null;
  }
}

/**
 * Hydrates the in-memory token before authenticated requests or sockets start.
 * Preferences maps to native system storage in the Capacitor applications.
 */
export function hydrateAccessToken(): Promise<string | null> {
  if (hydrated) return Promise.resolve(cachedToken);
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = Preferences.get({ key: STORAGE_KEY })
    .then(async ({ value }) => {
      const legacyToken = value ? null : takeLegacyToken();
      cachedToken = value ?? legacyToken;
      if (legacyToken) {
        await Preferences.set({ key: STORAGE_KEY, value: legacyToken });
      }
      hydrated = true;
      return cachedToken;
    })
    .catch(() => {
      cachedToken = null;
      hydrated = true;
      return null;
    })
    .finally(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}

export function getAccessToken(): string | null {
  return cachedToken;
}

export async function setAccessToken(token: string): Promise<void> {
  cachedToken = token;
  hydrated = true;
  await Preferences.set({ key: STORAGE_KEY, value: token });
}

export async function clearAccessToken(): Promise<void> {
  cachedToken = null;
  hydrated = true;
  await Preferences.remove({ key: STORAGE_KEY });
}
