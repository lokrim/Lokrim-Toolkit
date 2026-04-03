/**
 * @file useLocalStorage.ts
 * @description Typed React hook for reading and writing to `localStorage`
 * with automatic JSON serialisation/deserialisation.
 *
 * Key names for all entries should be imported from `src/lib/storage.ts`
 * (the central localStorage schema) rather than using raw string literals.
 *
 * @example
 * import { useLocalStorage } from "@/hooks/useLocalStorage";
 * import { STORAGE_KEYS } from "@/lib/storage";
 *
 * const [history, setHistory] = useLocalStorage<HistoryItem[]>(
 *   STORAGE_KEYS.promptGenerator.history,
 *   []
 * );
 */

import { useState, useEffect } from "react";

/**
 * Syncs a piece of React state with a `localStorage` entry.
 *
 * Behaves identically to `useState` from the component's perspective, but
 * every write is automatically persisted to `localStorage` as JSON and every
 * read is automatically parsed from JSON.
 *
 * Cross-tab sync: if another tab writes to the same key via `localStorage`,
 * this hook listens to the `storage` event and updates the local React state
 * automatically — keeping tabs in sync without a server.
 *
 * @param key - The localStorage key to bind to. Use a value from
 *   `STORAGE_KEYS` (in `src/lib/storage.ts`) rather than a raw string.
 * @param initialValue - The value to use if the key doesn't exist in storage,
 *   or if parsing the stored value fails.
 *
 * @returns A `[value, setValue]` tuple, identical in shape to `useState`.
 *   `setValue` accepts either a new value or an updater function `(prev) => next`.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // Initialise from localStorage on first render only (function-form initialiser
    // prevents re-running the storage read on every render).
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            // SSR guard — `localStorage` is not available on the server.
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    /**
     * Wrapped setter that persists the new value to localStorage in addition
     * to updating React state. Accepts a value or an updater function, matching
     * the standard `useState` setter signature.
     */
    const setValue = (value: T | ((val: T) => T)) => {
        setStoredValue((prev) => {
            try {
                const valueToStore = value instanceof Function ? value(prev) : value;
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            } catch (error) {
                // Storage quota exceeded or other write errors — state update
                // is rolled back silently to avoid inconsistent UI.
                console.warn(`Error setting localStorage key "${key}":`, error);
                return prev;
            }
        });
    };

    useEffect(() => {
        // Listen for changes written by other tabs/windows to the same key.
        // This is the mechanism that enables cross-tab state synchronisation
        // without any server involvement.
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                setStoredValue(JSON.parse(e.newValue));
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [key]);

    return [storedValue, setValue] as const;
}
