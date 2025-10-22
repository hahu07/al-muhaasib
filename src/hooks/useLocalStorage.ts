"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Serializer interface for custom data serialization
 */
export interface Serializer<T> {
  parse: (text: string) => T;
  stringify: (object: T) => string;
}

/**
 * Options for the useLocalStorage hook
 */
export interface UseLocalStorageOptions<T> {
  /** Custom serializer for complex data types */
  serializer?: Serializer<T>;
  /** Enable/disable synchronization across tabs */
  syncAcrossTabs?: boolean;
  /** Callback fired when storage value changes */
  onError?: (error: Error) => void;
}

/**
 * Production-grade localStorage hook with SSR safety, error handling,
 * and cross-tab synchronization.
 *
 * Features:
 * - SSR-safe (no hydration mismatches)
 * - Type-safe with custom serializers
 * - Cross-tab synchronization
 * - Error handling with fallback values
 * - Memory cleanup on unmount
 *
 * @template T The type of the stored value
 * @param key The localStorage key
 * @param initialValue The initial value if no stored value exists
 * @param options Additional configuration options
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'light', {
 *   syncAcrossTabs: true,
 *   onError: (error) => console.warn('Theme storage error:', error)
 * });
 *
 * const [user, setUser] = useLocalStorage('user', null, {
 *   serializer: {
 *     parse: (text) => JSON.parse(text),
 *     stringify: (obj) => JSON.stringify(obj)
 *   }
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serializer = JSON, syncAcrossTabs = false, onError } = options;

  // Keep track of the key to handle key changes
  const keyRef = useRef(key);
  const isMountedRef = useRef(true);

  // Initialize state with a function to avoid running localStorage on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Return initial value during SSR
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return serializer.parse(item);
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error("Failed to parse localStorage value");
      onError?.(err);
      return initialValue;
    }
  });

  // Update stored value and localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (!isMountedRef.current) return;

      try {
        // Handle function updates
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Update state
        setStoredValue(valueToStore);

        // Update localStorage
        if (typeof window !== "undefined") {
          if (valueToStore === undefined || valueToStore === null) {
            window.localStorage.removeItem(keyRef.current);
          } else {
            window.localStorage.setItem(
              keyRef.current,
              serializer.stringify(valueToStore),
            );
          }
        }
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("Failed to set localStorage value");
        onError?.(err);
      }
    },
    [storedValue, serializer, onError],
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(keyRef.current);
      }
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error("Failed to remove localStorage value");
      onError?.(err);
    }
  }, [initialValue, onError]);

  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (!isMountedRef.current || e.key !== keyRef.current) {
        return;
      }

      try {
        if (e.newValue === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(serializer.parse(e.newValue));
        }
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("Failed to sync localStorage value across tabs");
        onError?.(err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncAcrossTabs, initialValue, serializer, onError]);

  // Handle key changes
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;

      // Load value for new key
      if (typeof window !== "undefined") {
        try {
          const item = window.localStorage.getItem(key);
          if (item === null) {
            setStoredValue(initialValue);
          } else {
            setStoredValue(serializer.parse(item));
          }
        } catch (error) {
          const err =
            error instanceof Error
              ? error
              : new Error("Failed to load localStorage value for new key");
          onError?.(err);
          setStoredValue(initialValue);
        }
      }
    }
  }, [key, initialValue, serializer, onError]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for boolean values in localStorage with enhanced type safety
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false,
  options?: Omit<UseLocalStorageOptions<boolean>, "serializer">,
): [
  boolean,
  (value: boolean | ((prev: boolean) => boolean)) => void,
  () => void,
] {
  return useLocalStorage(key, initialValue, {
    ...options,
    serializer: {
      parse: (text: string) => text === "true",
      stringify: (value: boolean) => value.toString(),
    },
  });
}

/**
 * Hook for numeric values in localStorage with validation
 */
export function useLocalStorageNumber(
  key: string,
  initialValue: number = 0,
  options?: Omit<UseLocalStorageOptions<number>, "serializer">,
): [number, (value: number | ((prev: number) => number)) => void, () => void] {
  return useLocalStorage(key, initialValue, {
    ...options,
    serializer: {
      parse: (text: string) => {
        const num = Number(text);
        if (isNaN(num)) {
          throw new Error(`Invalid number format: ${text}`);
        }
        return num;
      },
      stringify: (value: number) => value.toString(),
    },
  });
}

/**
 * Hook for array values in localStorage with type safety
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = [],
  options?: Omit<UseLocalStorageOptions<T[]>, "serializer">,
): [T[], (value: T[] | ((prev: T[]) => T[])) => void, () => void] {
  return useLocalStorage(key, initialValue, {
    ...options,
    serializer: {
      parse: (text: string) => {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("Stored value is not an array");
        }
        return parsed;
      },
      stringify: (value: T[]) => JSON.stringify(value),
    },
  });
}

/**
 * Utility functions for localStorage management
 */
export const localStorageUtils = {
  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const test = "__localStorage_test__";
      window.localStorage.setItem(test, "test");
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get all localStorage keys with a specific prefix
   */
  getKeysWithPrefix: (prefix: string): string[] => {
    if (typeof window === "undefined") return [];

    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  },

  /**
   * Clear all localStorage keys with a specific prefix
   */
  clearKeysWithPrefix: (prefix: string): void => {
    if (typeof window === "undefined") return;

    const keys = localStorageUtils.getKeysWithPrefix(prefix);
    keys.forEach((key) => window.localStorage.removeItem(key));
  },

  /**
   * Get localStorage usage information
   */
  getUsage: (): { used: number; available: number; percentage: number } => {
    if (typeof window === "undefined") {
      return { used: 0, available: 0, percentage: 0 };
    }

    let used = 0;
    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        used += window.localStorage[key].length + key.length;
      }
    }

    // Most browsers limit localStorage to 5-10MB
    const available = 5 * 1024 * 1024; // 5MB estimate
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  },
} as const;
