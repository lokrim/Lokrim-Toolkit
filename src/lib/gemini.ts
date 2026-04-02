import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Model Registry
// Add new models here — they will automatically appear in SettingsModal.
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
// Shared helpers — used by every tool
// ---------------------------------------------------------------------------

/**
 * Returns the globally selected Gemini model ID from localStorage.
 * Falls back to DEFAULT_GEMINI_MODEL if nothing is stored or the stored
 * value is no longer in the registry.
 */
export function getActiveGeminiModel(): GeminiModelId {
    try {
        const stored = window.localStorage.getItem("lokrim_gemini_model");
        if (stored) {
            const parsed = JSON.parse(stored) as string;
            if (GEMINI_MODELS.some((m) => m.id === parsed)) {
                return parsed as GeminiModelId;
            }
        }
    } catch { /* ignore */ }
    return DEFAULT_GEMINI_MODEL;
}

/**
 * Resolves the active Gemini API key.
 *
 * Strategy (BYOK-first):
 *   1. User-provided key stored in localStorage  → used if present
 *   2. VITE_GEMINI_API_KEY env variable           → fallback for local dev
 *
 * Throws a user-friendly error if no key is found so tools can surface it
 * via toast without extra boilerplate.
 */
export function getActiveApiKey(): string {
    let customKey = "";
    try {
        const stored = window.localStorage.getItem("lokrim_gemini_key");
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
 * Convenience factory used by tools to get a ready-to-use GenerativeModel.
 *
 * Usage inside a tool:
 *   const model = createGeminiModel({ systemInstruction: MY_PROMPT });
 *   const result = await model.generateContent(userInput);
 */
export function createGeminiModel(
    options: Omit<Parameters<GoogleGenerativeAI["getGenerativeModel"]>[0], "model"> &
    { model?: GeminiModelId } = {}
) {
    const apiKey = getActiveApiKey(); // throws if missing
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        ...options,
        model: options.model ?? getActiveGeminiModel(),
    });
}
