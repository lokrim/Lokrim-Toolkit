/**
 * @file storage.test.ts
 * @description Snapshot test for the STORAGE_KEYS registry.
 *
 * Purpose: Guard against accidental key renames or schema drift.
 * If a key value ever changes unintentionally, this test will catch it and
 * force the developer to consciously update the snapshot — ensuring a
 * migration path is also added before the change ships.
 *
 * If you intentionally rename a key, update the snapshot AND add a migration
 * strategy to src/lib/storage.ts per the documented migration guide.
 */

import { describe, it, expect } from "vitest";
import { STORAGE_KEYS } from "../storage";

describe("STORAGE_KEYS registry", () => {
    it("matches the expected schema snapshot", () => {
        expect(STORAGE_KEYS).toMatchInlineSnapshot(`
      {
        "convert": {
          "apiKey": "lokrim_convert_key",
        },
        "gemini": {
          "apiKey": "lokrim_gemini_key",
          "model": "lokrim_gemini_model",
        },
        "markdownConverter": {
          "history": "lokrim_markdown_history",
        },
        "promptGenerator": {
          "history": "lokrim_prompt_history",
        },
      }
    `);
    });

    it("has no duplicate key values across domains", () => {
        // Flatten all string values from the nested object and check for duplicates.
        // Duplicate keys would cause one tool's data to silently overwrite another's.
        const allValues = Object.values(STORAGE_KEYS).flatMap((domain) =>
            Object.values(domain)
        );
        const uniqueValues = new Set(allValues);
        expect(uniqueValues.size).toBe(allValues.length);
    });
});
