'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDraftCacheOptions {
  key: string;
  debounceMs?: number;
}

interface UseDraftCacheReturn<T> {
  cachedValue: T | undefined;
  updateCache: (value: T) => void;
  clearCache: () => void;
}

export function useDraftCache<T>({
  key,
  debounceMs = 500,
}: UseDraftCacheOptions): UseDraftCacheReturn<T> {
  const [cachedValue, setCachedValue] = useState<T | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof NodeJS.Timeout> | null>(null);
  const pendingValueRef = useRef<T | undefined>(undefined);
  const keyRef = useRef(key);

  // Load initial value from localStorage (client-only)
  /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration must happen after mount */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        const cached = JSON.parse(raw) as T;
        setCachedValue(cached);
      } catch {
        // ignore parse errors
      }
    }
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const flushPending = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingValueRef.current !== undefined) {
      try {
        localStorage.setItem(keyRef.current, JSON.stringify(pendingValueRef.current));
      } catch {
        /* ignore quota errors */
      }
      pendingValueRef.current = undefined;
    }
  }, []);

  const updateCache = useCallback(
    (value: T) => {
      pendingValueRef.current = value;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        try {
          localStorage.setItem(keyRef.current, JSON.stringify(value));
        } catch {
          /* ignore quota errors */
        }
        pendingValueRef.current = undefined;
      }, debounceMs);
    },
    [debounceMs],
  );

  const clearCache = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingValueRef.current = undefined;
    try {
      localStorage.removeItem(keyRef.current);
    } catch {
      /* ignore */
    }
  }, []);

  // Flush pending write on unmount
  useEffect(() => {
    return () => {
      flushPending();
    };
  }, [flushPending]);

  return { cachedValue, updateCache, clearCache };
}
