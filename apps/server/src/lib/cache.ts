import { LRUCache } from 'lru-cache';

export const apiCache = new LRUCache<string, any>({
  ttl: 1000 * 30,
  max: 500,
});

export function cacheGet<T>(key: string): T | undefined {
  return apiCache.get(key) as T | undefined;
}

export function cacheSet<T>(key: string, value: T, ttlMs = 1000 * 30) {
  apiCache.set(key, value, { ttl: ttlMs });
}
