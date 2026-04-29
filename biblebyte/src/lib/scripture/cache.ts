type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 300_000;

/** In-memory TTL cache + single-flight deduplication (quota-safe burst handling). */
export async function withScriptureCache<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const ttl = ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS;
  const promise = (async () => {
    try {
      const value = await factory();
      store.set(key, { value, expiresAt: Date.now() + ttl });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function scriptureCacheKey(parts: string[]): string {
  return parts.join("|");
}
