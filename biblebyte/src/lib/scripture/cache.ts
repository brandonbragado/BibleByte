type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

const DEFAULT_TTL_MS = 300_000;

/** In-memory TTL cache for API.Bible responses (short TTL for chapter bodies per licensing posture). */
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
  const value = await factory();
  store.set(key, { value, expiresAt: now + (ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS) });
  return value;
}

export function scriptureCacheKey(parts: string[]): string {
  return parts.join("|");
}
