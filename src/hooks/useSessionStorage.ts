import { useState } from "react";

/**
 * Syncs a piece of React state with a `sessionStorage` entry.
 *
 * Behaves identically to `useState`, but every write is automatically
 * persisted to `sessionStorage` as JSON and every read is automatically
 * parsed from JSON. This storage ONLY lives as long as the specific browser
 * tab is open, making it perfect for caching UI state context when switching tools.
 *
 * @param key - The sessionStorage key to bind to. Use a value from
 *   `STORAGE_KEYS.session` (in `src/lib/storage.ts`) rather than a raw string.
 * @param initialValue - The value to use if the key doesn't exist in storage.
 *
 * @returns A `[value, setValue]` tuple, identical in shape to `useState`.
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        setStoredValue((prev) => {
            try {
                const valueToStore = value instanceof Function ? value(prev) : value;
                if (typeof window !== "undefined") {
                    window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            } catch (error) {
                console.warn(`Error setting sessionStorage key "${key}":`, error);
                return prev;
            }
        });
    };

    return [storedValue, setValue] as const;
}
