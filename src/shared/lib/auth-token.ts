const STORAGE_KEY = "bz_access_token";

function readStorage(get: (key: string) => string | null): string | null {
  try {
    return get(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(
  set: (key: string, value: string) => void,
  remove: (key: string) => void,
  token: string | null,
) {
  try {
    if (token) {
      set(STORAGE_KEY, token);
    } else {
      remove(STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * JWT for Authorization headers when the httpOnly cookie is unavailable.
 * Uses localStorage so Google OAuth sessions survive new tabs and refresh
 * (sessionStorage is tab-scoped and broke production Google sign-in).
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const fromLocal = readStorage((k) => localStorage.getItem(k));
  if (fromLocal) return fromLocal;

  const legacy = readStorage((k) => sessionStorage.getItem(k));
  if (legacy) {
    writeStorage(
      (k, v) => localStorage.setItem(k, v),
      (k) => localStorage.removeItem(k),
      legacy,
    );
    sessionStorage.removeItem(STORAGE_KEY);
    return legacy;
  }

  return null;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  writeStorage(
    (k, v) => localStorage.setItem(k, v),
    (k) => localStorage.removeItem(k),
    token,
  );
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  writeStorage(
    (k, v) => localStorage.setItem(k, v),
    (k) => localStorage.removeItem(k),
    null,
  );
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
