import { useCallback, useRef } from 'react';

interface UseDebouncedApiOptions {
  delay?: number;
  onError?: (error: Error) => void;
}

export const useDebouncedApi = (options: UseDebouncedApiOptions = {}) => {
  const { delay = 300, onError } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentPromiseRef = useRef<{ resolve: (value: any) => void; reject: (error: any) => void } | null>(null);

  const debouncedCall = useCallback(async <T>(
    apiCall: (signal?: AbortSignal) => Promise<T>,
    immediate: boolean = false
  ): Promise<T | null> => {
    // Cancel previous timeout and request
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Resolve previous promise with null if it exists
    if (currentPromiseRef.current) {
      currentPromiseRef.current.resolve(null);
      currentPromiseRef.current = null;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    if (immediate) {
      try {
        return await apiCall(abortControllerRef.current.signal);
      } catch (error) {
        // Only call onError for non-AbortError errors
        if (error instanceof Error && 
            error.name !== 'AbortError' && 
            error.message !== 'AbortError') {
          onError?.(error);
        }
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      // Store the promise resolver
      currentPromiseRef.current = { resolve, reject };
      
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await apiCall(abortControllerRef.current?.signal);
          if (currentPromiseRef.current) {
            currentPromiseRef.current.resolve(result);
            currentPromiseRef.current = null;
          }
        } catch (error) {
          // Only call onError for non-AbortError errors
          if (error instanceof Error && 
              error.name !== 'AbortError' && 
              error.message !== 'AbortError') {
            onError?.(error);
          }
          if (currentPromiseRef.current) {
            currentPromiseRef.current.resolve(null);
            currentPromiseRef.current = null;
          }
        }
      }, delay);
    });
  }, [delay, onError]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Resolve current promise with null
    if (currentPromiseRef.current) {
      currentPromiseRef.current.resolve(null);
      currentPromiseRef.current = null;
    }
  }, []);

  return { debouncedCall, cancel };
}; 