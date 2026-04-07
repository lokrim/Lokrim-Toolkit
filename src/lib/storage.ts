/**
 * @file storage.ts
 * @description Central localStorage schema for lokrim-toolkit.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * KEY REGISTRY
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * All localStorage string keys used anywhere in the app must be declared
 * here. This is the single source of truth — no raw string literals should
 * appear in any other file.
 *
 * Format: STORAGE_KEYS.[domain].[field]
 *
 * ┌────────────────────────┬──────────────────────────────────┬──────────────────────────┐
 * │ Key                    │ Value type                       │ Owner                    │
 * ├────────────────────────┼──────────────────────────────────┼──────────────────────────┤
 * │ lokrim_gemini_key      │ string (JSON-encoded API key)    │ SettingsModal, gemini.ts │
 * │ lokrim_gemini_model    │ GeminiModelId (JSON-encoded)     │ SettingsModal, gemini.ts │
 * │ lokrim_convert_key     │ string (JSON-encoded API secret) │ SettingsModal, pdfUtils  │
 * │ lokrim_prompt_history  │ HistoryEntry[] (JSON array)      │ usePromptGenerator       │
 * │ lokrim_markdown_history│ HistoryItem[] (JSON array)       │ MarkdownConverter        │
 * └────────────────────────┴──────────────────────────────────┴──────────────────────────┘
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MIGRATION STRATEGY
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * If you need to rename a key or change its serialization format:
 *  1. Add the new key next to the old key in this registry (don't delete old).
 *  2. In the reader (hook or util), read the old key first; if found, write to
 *     the new key and remove the old key, then return the migrated value.
 *  3. After one release cycle, delete the old key from this registry.
 *
 * This ensures existing users' persisted state is seamlessly migrated on
 * their next page load without a crash or data loss.
 */
export const STORAGE_KEYS = {
    /** Gemini API key and model selection — used by all AI-powered tools. */
    gemini: {
        apiKey: "lokrim_gemini_key",
        model:  "lokrim_gemini_model",
        imageModel: "lokrim_gemini_image_model",
    },
    /** ConvertAPI secret — used only by the Universal PDF Pipeline. */
    convert: {
        apiKey: "lokrim_convert_key",
    },
    /** Prompt Generator session history (max 20 entries). */
    promptGenerator: {
        history: "lokrim_prompt_history",
    },
    /** Web to Obsidian conversion history (max 30 entries). */
    markdownConverter: {
        history: "lokrim_markdown_history",
    },
    /** Flavour Forge kitchen defaults and session history. */
    flavourForge: {
        history: "lokrim_flavour_forge_history",
        defaults: "lokrim_flavour_forge_defaults",
    },
    /** Pollinations API key and model selection. */
    pollinations: {
        apiKey: "lokrim_pollinations_key",
        imageModel: "lokrim_pollinations_image_model",
    },
    /** Session-local context caching keys. */
    session: {
        flavourForge: {
            concepts: "lokrim_session_ff_concepts",
            expanded: "lokrim_session_ff_expanded"
        },
        markdownConverter: {
            inputUrl: "lokrim_session_mc_input",
            markdownOutput: "lokrim_session_mc_output"
        },
        promptGenerator: {
            formParams: "lokrim_session_pg_params",
            resultMarkdown: "lokrim_session_pg_result"
        }
    }
} as const;
