// Cache utility for localStorage with expiry
const CACHE_PREFIX = 'navadha_cache_';
const DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export const cache = {
  set: <T>(key: string, data: T, expiryMs: number = DEFAULT_EXPIRY): void => {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiryMs,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const itemStr = localStorage.getItem(CACHE_PREFIX + key);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = Date.now();

      // Check if expired
      if (now - item.timestamp > item.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  clear: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  // Clear all cache when user logs out
  clearUserCache: (): void => {
    cache.clear();
  },
};
