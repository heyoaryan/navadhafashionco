/**
 * Simple in-memory cache for Supabase queries.
 * Prevents duplicate fetches for the same data within a TTL window.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60_000; // 1 minute

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

export function invalidateCache(keyPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) cache.delete(key);
  }
}

/**
 * Wraps an async fetcher with cache-aside logic.
 * If cached data exists and is fresh, returns it immediately.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  setCached(key, data, ttl);
  return data;
}
