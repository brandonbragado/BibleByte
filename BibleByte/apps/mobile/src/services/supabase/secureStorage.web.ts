/**
 * Web shim for the Supabase auth storage adapter.
 *
 * Native uses `expo-secure-store` (Keychain / Keystore) — see the sibling
 * `secureStorage.ts`. Web has no equivalent, so we fall back to
 * `window.localStorage` with the same prefix.
 *
 * SECURITY NOTE: localStorage is XSS-readable. The web build is intended for
 * local development and previewing the mobile UI. Before any public web
 * release, switch to a server-mediated session (Supabase SSR helpers with
 * httpOnly cookies) or a PKCE flow that keeps tokens off `window`.
 *
 * TODO[WEB_AUTH_HARDENING]: replace with @supabase/ssr cookie storage if /
 * when the web shell becomes production-facing.
 */

const storagePrefix = "biblebites.auth.";

function memoryFallback() {
  const store = new Map<string, string>();
  return {
    getItem: async (key: string): Promise<string | null> => store.get(storagePrefix + key) ?? null,
    setItem: async (key: string, value: string): Promise<void> => {
      store.set(storagePrefix + key, value);
    },
    removeItem: async (key: string): Promise<void> => {
      store.delete(storagePrefix + key);
    }
  };
}

export const secureStorage = (() => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return memoryFallback();
    }
    const ls = window.localStorage;
    return {
      getItem: async (key: string): Promise<string | null> => ls.getItem(storagePrefix + key),
      setItem: async (key: string, value: string): Promise<void> => {
        ls.setItem(storagePrefix + key, value);
      },
      removeItem: async (key: string): Promise<void> => {
        ls.removeItem(storagePrefix + key);
      }
    };
  } catch {
    return memoryFallback();
  }
})();
