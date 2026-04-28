/**
 * Web shim for `kvStorage`. Backed by `window.localStorage` when available,
 * falling back to an in-memory map for SSR / non-browser environments.
 *
 * Note: localStorage is XSS-readable. For sensitive payloads on the web,
 * prefer cookie-based or service-side state. This shim is intentionally
 * limited to non-sensitive caches (analytics opt-in, today's snippet, locally
 * saved daily verses) which already live in MMKV on native.
 */

export type KvStorage = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
};

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

export function createKvStorage(id?: string): KvStorage {
  const prefix = id ? `${id}:` : "biblebyte:";

  if (!hasLocalStorage()) {
    const memory = new Map<string, string>();
    return {
      getString: (key) => memory.get(prefix + key),
      set: (key, value) => {
        memory.set(prefix + key, value);
      },
      delete: (key) => {
        memory.delete(prefix + key);
      }
    };
  }

  const ls = window.localStorage;
  return {
    getString: (key) => ls.getItem(prefix + key) ?? undefined,
    set: (key, value) => {
      try {
        ls.setItem(prefix + key, value);
      } catch (error) {
        console.warn("kvStorage_set_failed", error);
      }
    },
    delete: (key) => {
      try {
        ls.removeItem(prefix + key);
      } catch (error) {
        console.warn("kvStorage_delete_failed", error);
      }
    }
  };
}
