/**
 * @file useScribeToVault.ts
 * @description React hook that encapsulates the multi-pass AI pipeline,
 * progress logging, and file I/O for the Scribe to Vault tool.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PIPELINE ARCHITECTURE
 *
 *  transcribe()  → Pass 1 (OCR) + Pass 2 (Polish) — always run together
 *  refine()      → Pass 3 (Refine) — repeatable, user-triggered
 *  expand()      → Pass 4 (Expand) — repeatable, user-triggered
 *
 * Each pass is a separate Gemini call with its own system prompt and
 * temperature tuned for that pass's task (see src/lib/prompts/scribeToVault.ts).
 *
 *
 * USAGE:
 *   const { state, transcribe, refine, expand, reset } = useScribeToVault();
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useState } from "react";
import { toast } from "sonner";
import { PDFDocument, type PDFPage } from "pdf-lib";
import { createGeminiModel } from "@/lib/models";
import {
    OCR_SYSTEM_PROMPT,
    POLISH_SYSTEM_PROMPT,
    REFINE_SYSTEM_PROMPT,
    EXPAND_SYSTEM_PROMPT,
} from "@/lib/prompts/scribeToVault";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum accepted PDF file size in bytes (50 MB). */
const MAX_PDF_BYTES = 50 * 1024 * 1024;

/**
 * PDFs with more pages than this threshold are split into chunks before OCR.
 * This avoids hitting Gemini's per-request token/file-size limits.
 */
const CHUNK_THRESHOLD = 7;

/** Number of pages per OCR batch when chunking is needed. */
const CHUNK_SIZE = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Stage represents the pipeline's current state.
 * The component uses this to determine which buttons to show/hide/disable.
 */
export type Stage = "idle" | "processing" | "refining" | "expanding" | "done";

/** A single entry in the pipeline progress log, shown in the UI. */
export interface LogEntry {
    text: string;
    status: "done" | "running" | "error";
}

/** All reactive state surfaced by the hook to the component. */
export interface ScribeToVaultState {
    stage: Stage;
    file: File | null;
    progressLog: LogEntry[];
    markdownOutput: string;
    mdFilename: string;
    refineCount: number;
    expandCount: number;
    isCopied: boolean;
    /** Derived: whether any AI pass is currently running */
    isRunning: boolean;
    /** Derived: whether output should be visible */
    showOutput: boolean;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Reads a File into an ArrayBuffer (required by pdf-lib). */
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Failed to read PDF file."));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Derives an Obsidian-safe filename from the document's H1 heading.
 * Falls back to the provided `fallback` string if no H1 is found.
 *
 * @param markdown - The markdown content to search for an H1
 * @param fallback - Filename to use if no H1 heading is found
 * @returns A sanitized filename string ending in `.md`
 */
function deriveFilename(markdown: string, fallback: string): string {
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
        const title = h1Match[1].trim().replace(/[^\w\s\-()]/g, "").replace(/\s+/g, "_").slice(0, 80);
        if (title) return `${title}.md`;
    }
    return fallback;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScribeToVault() {
    const [stage, setStage] = useState<Stage>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [progressLog, setProgressLog] = useState<LogEntry[]>([]);
    const [markdownOutput, setMarkdownOutput] = useState("");
    const [mdFilename, setMdFilename] = useState("");
    const [refineCount, setRefineCount] = useState(0);
    const [expandCount, setExpandCount] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    // ── Progress log helpers ─────────────────────────────────────────────────

    /** Appends a new entry to the progress log. */
    function addLog(text: string, status: LogEntry["status"] = "done") {
        setProgressLog((prev) => [...prev, { text, status }]);
    }

    /**
     * Replaces the last log entry in-place. Used to update a "running" entry
     * to "done" or "error" once an async operation completes.
     */
    function updateLastLog(text: string, status: LogEntry["status"] = "done") {
        setProgressLog((prev) => {
            const updated = [...prev];
            if (updated.length > 0) updated[updated.length - 1] = { text, status };
            return updated;
        });
    }

    // ── File management ──────────────────────────────────────────────────────

    /**
     * Validates and sets the dropped PDF file. Call this from the dropzone's
     * onDrop handler in the component.
     *
     * @param dropped - The File object from the drop event
     * @returns true if the file was accepted, false if it was rejected (with toast)
     */
    function acceptFile(dropped: File): boolean {
        if (dropped.size > MAX_PDF_BYTES) {
            toast.error(`File too large (${(dropped.size / 1024 / 1024).toFixed(1)} MB). Max is 50 MB.`);
            return false;
        }
        setFile(dropped);
        setStage("idle");
        setProgressLog([]);
        setMarkdownOutput("");
        setMdFilename("");
        setRefineCount(0);
        setExpandCount(0);
        return true;
    }

    // ── Reset ────────────────────────────────────────────────────────────────

    /** Clears all pipeline state (but does not clear the dropped file). */
    function reset() {
        setStage("idle");
        setProgressLog([]);
        setMarkdownOutput("");
        setMdFilename("");
        setRefineCount(0);
        setExpandCount(0);
    }

    // ── Pass 1 + 2: OCR → Polish ─────────────────────────────────────────────

    /**
     * Runs the full OCR + Polish pipeline on the currently loaded PDF.
     * Large PDFs (> CHUNK_THRESHOLD pages) are automatically split into
     * CHUNK_SIZE-page batches, processed sequentially, and stitched before
     * the Polish pass to avoid Gemini token-limit truncation.
     *
     * On success, sets stage to "done" and populates markdownOutput.
     * On failure, surfaces a toast and resets stage to "idle".
     */
    async function transcribe() {
        if (!file) { toast.error("Please upload a PDF file first."); return; }

        setStage("processing");
        setProgressLog([]);
        setMarkdownOutput("");
        setMdFilename("");
        setRefineCount(0);

        try {
            // ── Phase 1: OCR ────────────────────────────────────────────────
            addLog("Loading PDF...", "running");
            const arrayBuffer = await fileToArrayBuffer(file);
            const originalPdf = await PDFDocument.load(arrayBuffer);
            const totalPages = originalPdf.getPageCount();
            const needsChunking = totalPages > CHUNK_THRESHOLD;
            const totalChunks = needsChunking ? Math.ceil(totalPages / CHUNK_SIZE) : 1;

            updateLastLog(
                needsChunking
                    ? `PDF loaded — ${totalPages} pages · splitting into ${totalChunks} OCR batches`
                    : `PDF loaded — ${totalPages} pages · single OCR batch`,
                "done"
            );

            const ocrModel = createGeminiModel({
                systemInstruction: OCR_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.1 },
            });

            const ocrChunks: string[] = [];
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const startPage = chunkIndex * CHUNK_SIZE;
                const endPage = Math.min(startPage + CHUNK_SIZE, totalPages);
                const label = totalChunks === 1
                    ? `OCR — all ${totalPages} pages`
                    : `OCR batch ${chunkIndex + 1}/${totalChunks} (pages ${startPage + 1}–${endPage})`;

                addLog(`${label}: sending...`, "running");
                try {
                    const chunkPdf = await PDFDocument.create();
                    const indices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
                    const copied = await chunkPdf.copyPages(originalPdf, indices);
                    copied.forEach((page: PDFPage) => chunkPdf.addPage(page));
                    const base64Data = await chunkPdf.saveAsBase64();

                    const result = await ocrModel.generateContent([
                        { inlineData: { mimeType: "application/pdf", data: base64Data } },
                        `Transcribe all ${endPage - startPage} page(s) verbatim.`,
                    ]);
                    ocrChunks.push(result.response.text());
                    updateLastLog(`${label}: complete ✓`, "done");
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "API error";
                    updateLastLog(`${label}: failed — ${msg}`, "error");
                    toast.error(`${label} failed and was skipped.`);
                }
            }

            if (ocrChunks.length === 0) {
                toast.error("All OCR batches failed. Please try again.");
                setStage("idle");
                return;
            }

            // Stitch chunks together with a visible separator that the Polish
            // system prompt instructs the model to remove.
            const rawOcr = ocrChunks.join("\n\n--- CHUNK BREAK ---\n\n");
            addLog(`OCR complete — ${ocrChunks.length}/${totalChunks} batch(es) succeeded.`, "done");

            // ── Phase 2: Polish ──────────────────────────────────────────────
            addLog("Polish pass: converting OCR text to GFM Markdown...", "running");
            const polishModel = createGeminiModel({
                systemInstruction: POLISH_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.2 },
            });

            const polishResult = await polishModel.generateContent(
                `Convert the following raw OCR transcript into clean GitHub-Flavored Markdown:\n\n${rawOcr}`
            );
            const md = polishResult.response.text().replace(/\\n/g, "\n");
            updateLastLog("Polish pass: complete ✓", "done");
            addLog("Done — Markdown ready below. Use 'Polish Further' to refine.", "done");

            setMarkdownOutput(md);
            setMdFilename(deriveFilename(md, file.name.replace(/\.pdf$/i, ".md")));
            setStage("done");
        } catch (err: unknown) {
            console.error("Transcribe error:", err);
            const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
            toast.error(msg);
            setStage("idle");
        }
    }

    // ── Pass 3: Refine (repeatable) ──────────────────────────────────────────

    /**
     * Applies a deep structural refinement pass to the current markdownOutput.
     * This pass is repeatable — each call increments refineCount.
     * Safe to call after transcribe() or a previous refine()/expand().
     */
    async function refine() {
        if (!markdownOutput.trim()) { toast.error("No output to refine."); return; }

        setStage("refining");
        addLog(`Refinement pass ${refineCount + 1}: analysing and improving structure...`, "running");

        try {
            const refineModel = createGeminiModel({
                systemInstruction: REFINE_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.3 },
            });

            const result = await refineModel.generateContent(
                `Perform a deep refinement pass on the following Markdown document:\n\n${markdownOutput}`
            );
            const refined = result.response.text().replace(/\\n/g, "\n");
            updateLastLog(`Refinement pass ${refineCount + 1}: complete ✓`, "done");

            setMarkdownOutput(refined);
            setMdFilename(deriveFilename(refined, mdFilename));
            setRefineCount((n) => n + 1);
            setStage("done");
        } catch (err: unknown) {
            console.error("Refine error:", err);
            const msg = err instanceof Error ? err.message : "Refinement failed. Please try again.";
            updateLastLog(`Refinement pass ${refineCount + 1}: failed`, "error");
            toast.error(msg);
            setStage("done");
        }
    }

    // ── Pass 4: Expand (repeatable) ──────────────────────────────────────────

    /**
     * Enriches the current markdownOutput by adding definitions, worked examples,
     * real-world context callouts, and key caveats — without altering original content.
     * This pass is repeatable — each call increments expandCount.
     */
    async function expand() {
        if (!markdownOutput.trim()) { toast.error("No output to expand."); return; }

        setStage("expanding");
        addLog(`Expand pass ${expandCount + 1}: adding definitions, examples, and context...`, "running");

        try {
            const expandModel = createGeminiModel({
                systemInstruction: EXPAND_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.4 },
            });

            const result = await expandModel.generateContent(
                `Expand the following Markdown notes by adding definitions, examples, context, and key points wherever the content is sparse:\n\n${markdownOutput}`
            );
            const expanded = result.response.text().replace(/\\n/g, "\n");
            updateLastLog(`Expand pass ${expandCount + 1}: complete ✓`, "done");

            setMarkdownOutput(expanded);
            setMdFilename(deriveFilename(expanded, mdFilename));
            setExpandCount((n) => n + 1);
            setStage("done");
        } catch (err: unknown) {
            console.error("Expand error:", err);
            const msg = err instanceof Error ? err.message : "Expand failed. Please try again.";
            updateLastLog(`Expand pass ${expandCount + 1}: failed`, "error");
            toast.error(msg);
            setStage("done");
        }
    }

    // ── Clipboard & Download ─────────────────────────────────────────────────

    /** Copies the current markdownOutput to the clipboard and flashes isCopied. */
    function copyToClipboard() {
        if (!markdownOutput) { toast.error("Nothing to copy."); return; }
        navigator.clipboard.writeText(markdownOutput);
        setIsCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
    }

    /**
     * Triggers a browser download of the current markdownOutput as a .md file.
     * Uses the current mdFilename (editable by user in the component).
     *
     * @param filename - The filename to use for the download
     */
    function download(filename: string) {
        if (!markdownOutput) { toast.error("Nothing to download."); return; }
        const safeFilename = filename.trim().endsWith(".md") ? filename.trim() : `${filename.trim() || "notes"}.md`;
        const blob = new Blob([markdownOutput], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Downloaded ${safeFilename}`);
    }

    // ── Public API ───────────────────────────────────────────────────────────

    const state: ScribeToVaultState = {
        stage,
        file,
        progressLog,
        markdownOutput,
        mdFilename,
        refineCount,
        expandCount,
        isCopied,
        isRunning: stage === "processing" || stage === "refining" || stage === "expanding",
        showOutput: stage === "done" || stage === "refining" || stage === "expanding",
    };

    return {
        /** All reactive state for the component to render */
        state,
        /** Accept a dropped file (validates size, resets pipeline state) */
        acceptFile,
        /** Run OCR + Polish passes */
        transcribe,
        /** Run Refine pass (repeatable) */
        refine,
        /** Run Expand pass (repeatable) */
        expand,
        /** Reset all pipeline state */
        reset,
        /** Copy current output to clipboard */
        copyToClipboard,
        /** Download current output as .md */
        download,
        /** Directly update the markdown output (for editable textarea) */
        setMarkdownOutput,
        /** Directly update the filename (for editable filename input) */
        setMdFilename,
    };
}
