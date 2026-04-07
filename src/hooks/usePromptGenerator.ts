/**
 * @file usePromptGenerator.ts
 * @description React hook that encapsulates all AI logic and history management
 * for the Master Prompt Generator tool.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * USAGE:
 *   const { state, generate, refine, history, restoreEntry, deleteEntry } =
 *     usePromptGenerator();
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createGeminiModel } from "@/lib/models";
import { STORAGE_KEYS } from "@/lib/storage";
import {
    GENERATE_SYSTEM_PROMPT,
    REFINE_SYSTEM_PROMPT,
    buildGenerateInput,
    buildRefineInput,
} from "@/lib/prompts/promptGenerator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single entry in the Prompt Generator session history. */
export interface HistoryEntry {
    id: string;
    timestamp: number;
    persona: string;
    domain: string;
    targetLLM: string;
    promptType: string;
    roughIdea: string;
    output: string;
}

/** All reactive state surfaced by the hook to the component. */
export interface PromptGeneratorState {
    outputPrompt: string;
    refineFeedback: string;
    isGenerating: boolean;
    isRefining: boolean;
    refineCount: number;
    isCopied: boolean;
    isWorking: boolean; // derived: isGenerating || isRefining
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// This module is the sole owner of the history key — all reads/writes go
// through these two helpers so the rest of the hook never touches raw strings.
// ---------------------------------------------------------------------------

/** Maximum number of history entries to retain in localStorage. */
const MAX_HISTORY = 20;

function loadHistory(): HistoryEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.promptGenerator.history);
        if (raw) return JSON.parse(raw) as HistoryEntry[];
    } catch { /* Ignore parse errors — return empty array */ }
    return [];
}

function saveHistory(entries: HistoryEntry[]): void {
    try {
        localStorage.setItem(
            STORAGE_KEYS.promptGenerator.history,
            JSON.stringify(entries.slice(0, MAX_HISTORY))
        );
    } catch { /* Ignore storage quota errors */ }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePromptGenerator() {
    const [outputPrompt, setOutputPrompt] = useState("");
    const [refineFeedback, setRefineFeedback] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [refineCount, setRefineCount] = useState(0);
    const [isCopied, setIsCopied] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // Load persisted history on mount.
    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    // ── History ──────────────────────────────────────────────────────────────

    /**
     * Prepends a new entry to the history list and persists it.
     * Oldest entries beyond MAX_HISTORY are automatically dropped.
     */
    function pushHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
        const newEntry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...entry,
        };
        const updated = [newEntry, ...history].slice(0, MAX_HISTORY);
        setHistory(updated);
        saveHistory(updated);
    }

    /**
     * Removes a single history entry by ID and persists the change.
     *
     * @param id - The UUID of the entry to remove
     */
    function deleteEntry(id: string) {
        const updated = history.filter((e) => e.id !== id);
        setHistory(updated);
        saveHistory(updated);
    }

    /**
     * Restores all input fields and the output from a history entry.
     * Returns the field values so the component can update its own state.
     *
     * @param entry - The history entry to restore
     * @returns An object with all restorable field values
     */
    function restoreEntry(entry: HistoryEntry) {
        setOutputPrompt(entry.output);
        setRefineCount(0);
        setRefineFeedback("");
        return {
            persona: entry.persona,
            domain: entry.domain,
            targetLLM: entry.targetLLM,
            promptType: entry.promptType,
            roughIdea: entry.roughIdea,
        };
    }

    // ── Generate ─────────────────────────────────────────────────────────────

    /**
     * Calls Gemini to engineer a master prompt from the provided parameters.
     * Validates required fields and shows toasts for errors.
     * On success, pushes the result to history and updates outputPrompt.
     *
     * @param persona - The target persona / role
     * @param domain - The domain / context (may be empty)
     * @param targetLLM - The selected target LLM value
     * @param promptType - The selected prompt type value
     * @param roughIdea - The user's raw idea input
     */
    async function generate(
        persona: string,
        domain: string,
        targetLLM: string,
        promptType: string,
        roughIdea: string,
    ) {
        if (!persona.trim()) { toast.error("Please enter a Target Persona."); return; }
        if (!roughIdea.trim()) { toast.error("Please enter a rough idea."); return; }
        if (!targetLLM) { toast.error("Please select a Target LLM."); return; }
        if (!promptType) { toast.error("Please select a Prompt Type."); return; }

        setIsGenerating(true);
        setOutputPrompt("");
        setRefineCount(0);
        setRefineFeedback("");

        try {
            const model = createGeminiModel({
                systemInstruction: GENERATE_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.85 },
            });
            const result = await model.generateContent(
                buildGenerateInput(persona, domain, targetLLM, promptType, roughIdea)
            );
            const output = result.response.text();
            setOutputPrompt(output);
            pushHistory({ persona, domain, targetLLM, promptType, roughIdea, output });
            toast.success("Master prompt generated!");
        } catch (err: unknown) {
            // getActiveApiKey() throws a user-friendly Error if no key is configured;
            // that message is surfaced here via toast (crash-at-the-boundary pattern).
            const msg = err instanceof Error ? err.message : "Failed to generate prompt.";
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    }

    // ── Refine ───────────────────────────────────────────────────────────────

    /**
     * Calls Gemini to apply surgical improvements to the existing outputPrompt
     * based on user feedback. Updates outputPrompt and increments refineCount.
     *
     * @param feedback - The user's refinement instructions
     */
    async function refine(feedback: string) {
        if (!outputPrompt.trim()) { toast.error("Generate a prompt first."); return; }
        if (!feedback.trim()) { toast.error("Enter refinement feedback."); return; }

        setIsRefining(true);
        try {
            const model = createGeminiModel({
                systemInstruction: REFINE_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.65 },
            });
            const result = await model.generateContent(buildRefineInput(outputPrompt, feedback));
            const refined = result.response.text();
            setOutputPrompt(refined);
            setRefineCount((n) => n + 1);
            setRefineFeedback("");
            toast.success("Prompt refined!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Refinement failed.";
            toast.error(msg);
        } finally {
            setIsRefining(false);
        }
    }

    // ── Clipboard & Download ─────────────────────────────────────────────────

    /** Copies the current outputPrompt to the clipboard and flashes the isCopied state. */
    function copyToClipboard() {
        if (!outputPrompt) { toast.error("Nothing to copy!"); return; }
        navigator.clipboard.writeText(outputPrompt);
        setIsCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
    }

    /**
     * Triggers a browser download of the current outputPrompt as a .txt file.
     * The filename is derived from the persona (first 40 chars, spaces → underscores).
     *
     * @param persona - Used to derive the download filename
     */
    function download(persona: string) {
        if (!outputPrompt) { toast.error("Nothing to download!"); return; }
        const safeName = (persona.trim().replace(/\s+/g, "_").slice(0, 40) || "master_prompt") + ".txt";
        const blob = new Blob([outputPrompt], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Downloaded ${safeName}`);
    }

    // ── Public API ───────────────────────────────────────────────────────────

    const state: PromptGeneratorState = {
        outputPrompt,
        refineFeedback,
        isGenerating,
        isRefining,
        refineCount,
        isCopied,
        isWorking: isGenerating || isRefining,
    };

    return {
        /** All reactive state for the component to render */
        state,
        /** Setter for refineFeedback (controlled input lives in component) */
        setRefineFeedback,
        /** Setter for outputPrompt (allows direct edits in the output textarea) */
        setOutputPrompt,
        /** Trigger the AI generate pass */
        generate,
        /** Trigger the AI refine pass */
        refine,
        /** Copy current output to clipboard */
        copyToClipboard,
        /** Download current output as .txt */
        download,
        /** Persisted session history entries */
        history,
        /** Remove a single history entry */
        deleteEntry,
        /** Restore all fields from a history entry; returns field values for component */
        restoreEntry,
    };
}
