/**
 * @file models.test.ts
 * @description Unit tests for the shared Gemini utility functions.
 *
 * Tests cover:
 *  - getActiveGeminiModel(): localStorage fallback, valid stored value, stale ID handling
 *  - getActiveApiKey(): env var fallback, throws when no key is found
 *
 * localStorage is mocked via vitest's `vi.stubGlobal` to avoid touching the
 * real browser storage. import.meta.env is stubbed for env var tests.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getActiveGeminiModel, getActiveApiKey, DEFAULT_GEMINI_MODEL } from "../models";
import { STORAGE_KEYS } from "../storage";

// ---------------------------------------------------------------------------
// localStorage mock
// We replace window.localStorage with a Map-backed in-memory mock so tests
// are isolated and don't rely on a real browser environment.
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getActiveGeminiModel()", () => {
    beforeEach(() => {
        vi.stubGlobal("window", { localStorage: localStorageMock });
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns DEFAULT_GEMINI_MODEL when localStorage is empty", () => {
        expect(getActiveGeminiModel()).toBe(DEFAULT_GEMINI_MODEL);
    });

    it("returns the stored model ID when a valid registered model is stored", () => {
        localStorageMock.setItem(STORAGE_KEYS.gemini.model, JSON.stringify("gemini-2.5-flash"));
        expect(getActiveGeminiModel()).toBe("gemini-2.5-flash");
    });

    it("falls back to DEFAULT_GEMINI_MODEL when the stored ID is not in the registry", () => {
        // Simulates a stale/deprecated model ID persisted from a previous app version
        localStorageMock.setItem(STORAGE_KEYS.gemini.model, JSON.stringify("gemini-1.0-ultra-deprecated"));
        expect(getActiveGeminiModel()).toBe(DEFAULT_GEMINI_MODEL);
    });

    it("falls back to DEFAULT_GEMINI_MODEL when the stored value is not valid JSON", () => {
        // Raw un-quoted string (not JSON-encoded) — simulates a corrupted entry
        localStorageMock.setItem(STORAGE_KEYS.gemini.model, "not-json{{{");
        expect(getActiveGeminiModel()).toBe(DEFAULT_GEMINI_MODEL);
    });
});

describe("getActiveApiKey()", () => {
    beforeEach(() => {
        vi.stubGlobal("window", { localStorage: localStorageMock });
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("throws a user-friendly error when no key is configured anywhere", () => {
        // No localStorage key, no env var
        vi.stubEnv("VITE_GEMINI_API_KEY", "");
        expect(() => getActiveApiKey()).toThrowError(
            "Gemini API key is not configured"
        );
    });

    it("returns the user BYOK key from localStorage when set", () => {
        localStorageMock.setItem(STORAGE_KEYS.gemini.apiKey, JSON.stringify("test-api-key-123"));
        expect(getActiveApiKey()).toBe("test-api-key-123");
    });
});
