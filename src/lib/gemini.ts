/**
 * @file gemini.ts
 * @description Shared Gemini AI factory for lokrim-toolkit.
 *
 * This module is the sole entrypoint for AI operations across all tools.
 * It is responsible for exactly three things:
 *  1. The Gemini model registry (`GEMINI_MODELS`, `DEFAULT_GEMINI_MODEL`)
 *  2. BYOK key resolution (`getActiveApiKey`)
 *  3. A convenience model factory (`createGeminiModel`)
 *
 * Everything else — system prompts, generation configs, temperature values —
 * belongs in the tool's own file in `src/lib/prompts/` or in its hook.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * localStorage keys read by this module:
 *  - STORAGE_KEYS.gemini.apiKey  — user-provided API key (BYOK, highest priority)
 *  - STORAGE_KEYS.gemini.model   — user-selected model ID
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { STORAGE_KEYS } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Model Registry
// Add new models here — they will automatically appear in SettingsModal.
// Remove obsolete models here — getActiveGeminiModel() gracefully falls back
// to DEFAULT_GEMINI_MODEL if a user's stored ID is no longer in this list.
// ---------------------------------------------------------------------------
export const GEMINI_MODELS = [
    { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (default)" },
    { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite" },
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
] as const;

export type GeminiModelId = typeof GEMINI_MODELS[number]["id"];

export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-3-flash-preview";

// ---------------------------------------------------------------------------
// Shared helpers — used by every AI-powered tool
// ---------------------------------------------------------------------------

/**
 * Returns the globally selected Gemini model ID from localStorage.
 *
 * Resolution order:
 *  1. Value stored at `STORAGE_KEYS.gemini.model` — used if it is still a
 *     valid (registered) model ID.
 *  2. Falls back to `DEFAULT_GEMINI_MODEL` if nothing is stored, the value
 *     cannot be parsed, or the stored ID has been removed from the registry
 *     (graceful deprecation handling).
 *
 * @returns A `GeminiModelId` that is guaranteed to be in `GEMINI_MODELS`
 */
export function getActiveGeminiModel(): GeminiModelId {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.gemini.model);
        if (stored) {
            const parsed = JSON.parse(stored) as string;
            if (GEMINI_MODELS.some((m) => m.id === parsed)) {
                return parsed as GeminiModelId;
            }
        }
    } catch { /* Ignore — fall through to default */ }
    return DEFAULT_GEMINI_MODEL;
}

/**
 * Resolves the active Gemini API key.
 *
 * Resolution order (BYOK-first):
 *  1. User-provided key stored at `STORAGE_KEYS.gemini.apiKey` in localStorage
 *     → used if present and non-empty.
 *  2. `VITE_GEMINI_API_KEY` environment variable → fallback for local dev
 *     (set in `.env`; never committed to source control).
 *
 * @throws {Error} A user-friendly error message if no key is found anywhere.
 *   This error is designed to bubble up to the component layer and be caught
 *   by a try/catch, then surfaced to the user via a Sonner toast notification
 *   (the "crash-at-the-boundary" pattern used throughout this app).
 *
 * @returns The active API key string
 */
export function getActiveApiKey(): string {
    let customKey = "";
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.gemini.apiKey);
        if (stored) customKey = JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse stored Gemini API key:", e);
    }
    const activeKey = customKey || (import.meta.env.VITE_GEMINI_API_KEY ?? "");
    if (!activeKey) {
        throw new Error(
            "Gemini API key is not configured. Please add it in Settings or set VITE_GEMINI_API_KEY."
        );
    }
    return activeKey;
}

/**
 * Convenience factory used by tools to get a ready-to-use `GenerativeModel`.
 *
 * Combines `getActiveApiKey()` and `getActiveGeminiModel()` into a single call.
 * Always call this inside an async handler (not at module load time) so the
 * API key is resolved at the moment of use, not at module initialisation.
 *
 * @param options - Passed directly to `GoogleGenerativeAI.getGenerativeModel()`.
 *   Omit `model` to use the user's globally selected model. Pass `model`
 *   explicitly to override (useful for tools with specific model requirements).
 *
 * @throws {Error} Propagates the error from `getActiveApiKey()` if no key is set.
 *
 * @example
 * const model = createGeminiModel({ systemInstruction: MY_PROMPT });
 * const result = await model.generateContent(userInput);
 */
export function createGeminiModel(
    options: Omit<Parameters<GoogleGenerativeAI["getGenerativeModel"]>[0], "model"> &
    { model?: GeminiModelId } = {}
) {
    const apiKey = getActiveApiKey(); // throws if missing — by design
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        ...options,
        model: options.model ?? getActiveGeminiModel(),
    });
}
