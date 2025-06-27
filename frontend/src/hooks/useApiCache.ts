import { useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseApiCacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of cache entries (default: 100)
}

export const useApiCache = <T>(options: UseApiCacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T): void => {
    // Clean up expired entries first
    const now = Date.now();
    const entries = Array.from(cacheRef.current.entries());
    for (const [cacheKey, entry] of entries) {
      if (now > entry.expiresAt) {
        cacheRef.current.delete(cacheKey);
      }
    }

    // Check if cache is full
    if (cacheRef.current.size >= maxSize) {
      // Remove oldest entry
      const oldestKey = Array.from(cacheRef.current.keys())[0];
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }

    // Add new entry
    cacheRef.current.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }, [ttl, maxSize]);

  const invalidate = useCallback((key?: string): void => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  const invalidatePattern = useCallback((pattern: RegExp): void => {
    const keys = Array.from(cacheRef.current.keys());
    for (const key of keys) {
      if (pattern.test(key)) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  const getStats = useCallback(() => {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    const entries = Array.from(cacheRef.current.values());
    for (const entry of entries) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: cacheRef.current.size,
      valid: validEntries,
      expired: expiredEntries,
    };
  }, []);

  return {
    get,
    set,
    invalidate,
    invalidatePattern,
    getStats,
  };
}; 