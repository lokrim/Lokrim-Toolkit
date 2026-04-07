import { useState } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { STORAGE_KEYS } from "@/lib/storage";
import {
    Copy, Loader2, FileCheck2, Bot, History,
    Download, WandSparkles, Trash2, X, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePromptGenerator, type HistoryEntry } from "@/hooks/usePromptGenerator";
import { TARGET_LLM_GROUPS, PROMPT_TYPE_OPTIONS, getLLMLabel, getTypeLabel } from "@/lib/prompts/promptGenerator";

// ---------------------------------------------------------------------------
// Utility helpers (display-only, co-located with the view)
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Master Prompt Generator — view layer.
 *
 * All AI logic, history management, and localStorage access is handled by
 * `usePromptGenerator`. This component is purely responsible for rendering
 * state and dispatching actions back to the hook.
 */
export default function PromptGenerator() {
    const [formParams, setFormParams] = useSessionStorage(STORAGE_KEYS.session.promptGenerator.formParams, {
        persona: "",
        domain: "",
        targetLLM: "",
        promptType: "",
        roughIdea: ""
    });
    
    // We can destructure for rendering
    const { persona, domain, targetLLM, promptType, roughIdea } = formParams;
    
    // Helper setters
    const setPersona = (val: string) => setFormParams(p => ({ ...p, persona: val }));
    const setDomain = (val: string) => setFormParams(p => ({ ...p, domain: val }));
    const setTargetLLM = (val: string) => setFormParams(p => ({ ...p, targetLLM: val }));
    const setPromptType = (val: string) => setFormParams(p => ({ ...p, promptType: val }));
    const setRoughIdea = (val: string) => setFormParams(p => ({ ...p, roughIdea: val }));

    const [showHistory, setShowHistory] = useState(false);

    const {
        state,
        setRefineFeedback,
        setOutputPrompt,
        generate,
        refine,
        copyToClipboard,
        download,
        history,
        deleteEntry,
        restoreEntry,
    } = usePromptGenerator();

    const { outputPrompt, refineFeedback, isGenerating, isRefining, refineCount, isCopied, isWorking } = state;

    const handleRestoreEntry = (entry: HistoryEntry) => {
        const fields = restoreEntry(entry);
        setPersona(fields.persona);
        setDomain(fields.domain);
        setTargetLLM(fields.targetLLM);
        setPromptType(fields.promptType);
        setRoughIdea(fields.roughIdea);
        setShowHistory(false);
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <div className="flex flex-col h-full w-full p-6 space-y-4">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col space-y-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Master Prompt Generator
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Transform a rough idea into a production-ready, battle-tested master prompt — even a single sentence works.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowHistory((s) => !s)}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors border shrink-0 ${showHistory
                                ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                    >
                        <History className="h-4 w-4" />
                        <span>History</span>
                        {history.length > 0 && (
                            <span className="ml-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">
                                {history.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── History Drawer ──────────────────────────────────────────── */}
            {showHistory && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40 shrink-0">
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            <Clock className="h-4 w-4" />
                            <span>Prompt History</span>
                            <span className="text-zinc-400 font-normal text-xs">— click any entry to restore all fields and output</span>
                        </div>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                            No history yet. Generate your first prompt to start tracking.
                        </div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                            {history.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group transition-colors"
                                    onClick={() => handleRestoreEntry(entry)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate max-w-[140px]">
                                                {entry.persona}
                                            </span>
                                            {entry.domain && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                                                    {entry.domain}
                                                </span>
                                            )}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                                                {getLLMLabel(entry.targetLLM)}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                                                {getTypeLabel(entry.promptType)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                            {entry.roughIdea}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                            {formatTimestamp(entry.timestamp)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 shrink-0 mt-0.5"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Main 2-Column Layout ─────────────────────────────────────── */}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col lg:flex-row gap-6 pt-1">

                {/* ── Left: Input Configuration ─────────────────────────── */}
                <div className="w-full lg:w-[42%] flex flex-col min-h-0 space-y-3">

                    {/* Persona */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Persona / Role
                        </label>
                        <Input
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            placeholder="e.g. Senior iOS Engineer, UX Researcher, DevOps Architect"
                            className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 h-10 shadow-sm"
                        />
                    </div>

                    {/* Domain */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Domain / Context{" "}
                            <span className="text-zinc-400 dark:text-zinc-500 font-normal">(Optional)</span>
                        </label>
                        <Input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="e.g. SaaS onboarding, mobile game, e-commerce checkout"
                            className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 h-10 shadow-sm"
                        />
                    </div>

                    {/* Target LLM + Prompt Type side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Target LLM
                            </label>
                            <Select value={targetLLM} onValueChange={setTargetLLM}>
                                <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-10 shadow-sm text-sm focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700">
                                    <SelectValue placeholder="Select model..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {TARGET_LLM_GROUPS.map((group) => (
                                        <SelectGroup key={group.label}>
                                            <SelectLabel>{group.label}</SelectLabel>
                                            {group.options.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Prompt Type
                            </label>
                            <Select value={promptType} onValueChange={setPromptType}>
                                <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-10 shadow-sm text-sm focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROMPT_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Rough Idea */}
                    <div className="flex-1 flex flex-col min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 transition-shadow">
                        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between shrink-0">
                            <span>Rough Idea</span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
                                even a single sentence — we'll expand it
                            </span>
                        </div>
                        <Textarea
                            value={roughIdea}
                            onChange={(e) => setRoughIdea(e.target.value)}
                            className="flex-1 p-4 bg-transparent border-0 outline-none resize-none font-mono text-sm leading-relaxed rounded-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            placeholder={"e.g. build auth middleware for express\n\nor: a dashboard for SaaS metrics\n\nor: futuristic city portrait at dusk"}
                        />
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={() => generate(persona, domain, targetLLM, promptType, roughIdea)}
                        disabled={isWorking || !roughIdea.trim() || !persona.trim() || !targetLLM || !promptType}
                        className="w-full h-12 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-purple-600 dark:text-zinc-50 dark:hover:bg-purple-500 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:opacity-100 font-medium transition-all shadow-sm rounded-xl"
                    >
                        {isGenerating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Engineering Prompt...</>
                        ) : (
                            <><Bot className="mr-2 h-4 w-4" />Generate Master Prompt</>
                        )}
                    </Button>
                </div>

                {/* ── Right: Output ─────────────────────────────────────── */}
                <div className="w-full lg:w-[58%] flex flex-col min-h-0 min-w-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40">

                    {/* Output header */}
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center justify-between text-zinc-700 dark:text-zinc-300 shrink-0">
                        <div className="flex items-center gap-2">
                            <span>Engineered Prompt</span>
                            {refineCount > 0 && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                    Refined {refineCount}×
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => download(persona)}
                                disabled={!outputPrompt}
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs font-semibold">Download</span>
                            </button>
                            <button
                                onClick={copyToClipboard}
                                disabled={!outputPrompt}
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isCopied
                                    ? <FileCheck2 className="h-4 w-4 text-green-500" />
                                    : <Copy className="h-4 w-4" />
                                }
                                <span className="text-xs font-semibold">{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Output textarea */}
                    <div className="flex-1 relative bg-transparent overflow-hidden flex flex-col min-h-0">
                        {isGenerating && !outputPrompt ? (
                            <div className="absolute inset-0 p-4 space-y-3">
                                <Skeleton className="h-4 w-[92%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[72%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[85%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[60%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[80%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[78%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[55%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[90%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[65%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                            </div>
                        ) : (
                            <Textarea
                                value={outputPrompt}
                                onChange={(e) => setOutputPrompt(e.target.value)}
                                className="flex-1 w-full h-full p-4 border-0 outline-none resize-none font-mono text-sm leading-relaxed rounded-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 bg-transparent"
                                placeholder="Your engineered master prompt will appear here. Fill in the fields on the left and click Generate."
                            />
                        )}
                    </div>

                    {/* Refine strip — visible only after a prompt exists */}
                    {outputPrompt && !isGenerating && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center gap-2 shrink-0">
                            <WandSparkles className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            <Input
                                value={refineFeedback}
                                onChange={(e) => setRefineFeedback(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !isWorking) {
                                        e.preventDefault();
                                        refine(refineFeedback);
                                    }
                                }}
                                placeholder="e.g. add few-shot examples, make it more concise, add error handling..."
                                className="flex-1 h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm"
                                disabled={isRefining}
                            />
                            <Button
                                onClick={() => refine(refineFeedback)}
                                disabled={isRefining || !refineFeedback.trim()}
                                size="sm"
                                className="h-9 px-4 bg-zinc-900 dark:bg-purple-600 hover:bg-zinc-800 dark:hover:bg-purple-500 text-white shrink-0 text-xs font-medium disabled:opacity-50"
                            >
                                {isRefining
                                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Refining...</>
                                    : "Refine"
                                }
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
