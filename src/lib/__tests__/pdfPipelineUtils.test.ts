/**
 * @file pdfPipelineUtils.test.ts
 * @description Unit tests for the PDF Pipeline utility functions.
 *
 * Tests cover getActiveConvertApiKey() throwing behaviour when no key
 * is configured — the most critical edge case for the PDF Pipeline tool
 * since a missing key would silently fail to process Office documents.
 *
 * Note: processPdfPipeline() is not tested here because it requires binary
 * PDF fixtures and browser APIs (FileReader, XMLHttpRequest) that are better
 * suited to integration tests. Those are deferred to a future test phase.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { STORAGE_KEYS } from "../storage";

// ---------------------------------------------------------------------------
// We need to access getActiveConvertApiKey which is a module-private function.
// The cleanest approach for a pure util test is to test it indirectly through
// processPdfPipeline's early-exit path — passing an empty file array with
// compressOutput: true forces the key to be resolved without needing real files.
// ---------------------------------------------------------------------------

// Provide a minimal stub for PDFDocument so pdf-lib doesn't throw in the
// test environment where no browser binary APIs are available.
vi.mock("pdf-lib", () => ({
    PDFDocument: {
        create: vi.fn().mockResolvedValue({
            save: vi.fn().mockResolvedValue(new Uint8Array()),
        }),
    },
}));

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

describe("PDF Pipeline — ConvertAPI key resolution", () => {
    beforeEach(() => {
        vi.stubGlobal("window", { localStorage: localStorageMock });
        localStorageMock.clear();
        // Reset modules before each test so the ENV_API_KEY constant is
        // re-evaluated with the current stub — without this, the const
        // captures its value at first import and ignores later stubs.
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it("throws when compressOutput is true and no ConvertAPI key is configured", async () => {
        // Stub env BEFORE importing the module so ENV_API_KEY is empty
        vi.stubEnv("VITE_CONVERT_API_KEY", "");
        const { processPdfPipeline } = await import("../pdfPipelineUtils");

        await expect(
            processPdfPipeline([], true, vi.fn())
        ).rejects.toThrowError("ConvertAPI key is not configured");
    });

    it("does NOT throw when processing only native PDFs with no compression", async () => {
        // Native PDFs don't need ConvertAPI — the pipeline should succeed
        // even without a key configured when compressOutput is false.
        const { processPdfPipeline } = await import("../pdfPipelineUtils");
        vi.stubEnv("VITE_CONVERT_API_KEY", "");

        // Empty file list — no files to process, no key needed
        await expect(
            processPdfPipeline([], false, vi.fn())
        ).resolves.toBeInstanceOf(Uint8Array);
    });

    it("uses the BYOK key from localStorage when set", async () => {
        localStorageMock.setItem(STORAGE_KEYS.convert.apiKey, JSON.stringify("test-convert-key"));
        const { processPdfPipeline } = await import("../pdfPipelineUtils");

        // With a key present, the function should not throw on the key resolution step.
        // We use an empty file list so no actual network calls are made.
        // It will still throw attempting compression with no real API — that's expected.
        await expect(
            processPdfPipeline([], true, vi.fn())
        ).rejects.not.toThrowError("ConvertAPI key is not configured");
    });
});
