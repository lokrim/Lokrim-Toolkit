import { useState, useEffect } from "react";
import {
    Copy, Loader2, FileCheck2, Bot, History,
    Download, WandSparkles, Trash2, X, Clock,
} from "lucide-react";
import { createGeminiModel } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Configuration — Dropdowns
// ---------------------------------------------------------------------------
const TARGET_LLM_GROUPS: Array<{
    label: string;
    options: Array<{ value: string; label: string }>;
}> = [
        {
            label: "OpenAI",
            options: [
                { value: "gpt-4o", label: "GPT-4o" },
                { value: "gpt-4o-mini", label: "GPT-4o mini" },
            ],
        },
        {
            label: "Anthropic",
            options: [
                { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
                { value: "claude-3-haiku", label: "Claude 3 Haiku" },
            ],
        },
        {
            label: "Google",
            options: [
                { value: "gemini-pro", label: "Gemini Pro" },
                { value: "gemini-flash", label: "Gemini Flash" },
            ],
        },
        {
            label: "Open Source",
            options: [
                { value: "llama-3", label: "Llama 3 (Meta)" },
                { value: "mistral-large", label: "Mistral Large" },
            ],
        },
        {
            label: "Image Generation",
            options: [
                { value: "gemini-image", label: "Nanobanana (Image Generation)" },
                { value: "chatgpt-image", label: "ChatGPT (Image Generation)" },
                { value: "midjourney-v6", label: "Midjourney v6" },
                { value: "stable-diffusion-xl", label: "Stable Diffusion XL" },
                { value: "flux-1", label: "Flux.1" },
            ],
        },
    ];

const PROMPT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "system-prompt", label: "System Prompt" },
    { value: "user-task", label: "User Task Prompt" },
    { value: "agent-task", label: "Agent Task" },
    { value: "chain-of-thought", label: "Chain-of-Thought (CoT)" },
    { value: "code-generation", label: "Code Generation" },
    { value: "image-generation", label: "Image / Art Generation" },
    { value: "agentic-dev", label: "Agentic Development Environment" },
    { value: "roleplay", label: "Roleplay / Persona" },
    { value: "data-extraction", label: "Data Extraction / Analysis" },
];

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

/**
 * GENERATE — Meta-prompt that engineers the user's master prompt.
 *
 * Design principles:
 *  - Directive 1: If rough idea is sparse, the model invents the full methodology.
 *  - Directive 2: Sections are dynamically chosen based on prompt type/use-case.
 *  - Directive 3: Writing style adapts to the target LLM's syntax conventions.
 *  - Directive 4: Output is 600–1200 words, substantive, and immediately usable.
 *  - Directive 5: Raw text only — no wrappers, no preamble.
 */
const GENERATE_SYSTEM_PROMPT = `You are a world-class Prompt Architect — the definitive authority on engineering prompts that make AI models perform at their absolute ceiling. You have spent years studying how every major LLM processes instructions, and you know exactly how to structure a prompt for maximum effectiveness.

Your sole task: Transform the provided persona, domain, prompt type, target LLM, and rough idea into a single, complete, immediately-usable master prompt.

═══════════════════════════════════════════════════════════════
DIRECTIVE 1 — IDEA EXPANSION (MOST CRITICAL)
═══════════════════════════════════════════════════════════════

When the rough idea is sparse, vague, or minimal (a few words or a single sentence):
- You MUST autonomously invent and introduce a complete, coherent methodology for achieving the goal.
- Make intelligent, expert-level assumptions about architecture, workflow, constraints, tools, deliverables, edge cases, and success criteria — all anchored by the persona and domain provided.
- Draw on what a world-class practitioner in this domain would naturally know and do. Think deeply about the problem.
- The generated prompt must be substantive and production-ready regardless of how little was given as input.
- NEVER produce a prompt with placeholders like "[add your details here]" or "[specify requirements]". Fill every gap yourself with expert judgement.
- Introduce at least 2–3 creative insights, design decisions, or best practices the user did NOT specify but that a domain expert would include.

When the rough idea is detailed:
- Honour every specific request while enriching the prompt with expert insights the user didn't think to mention.

═══════════════════════════════════════════════════════════════
DIRECTIVE 2 — DYNAMIC SECTION SELECTION
═══════════════════════════════════════════════════════════════

Do NOT use a fixed section template. Choose the sections that best fit the prompt type and domain. Reference templates by type:

SYSTEM PROMPT → Identity & Persona Declaration | Core Principles & Values | Behavioural Guardrails | Tone & Communication Style | Capabilities & Scope | What to Avoid / Refuse | Fallback Behaviour & Edge Cases

USER TASK PROMPT → Role Context | Task Objective | Background & Problem Statement | Step-by-Step Instructions | Constraints & Rules | Expected Output Format | Quality Criteria & Success Metrics

AGENT TASK → Role & Capability Declaration | Primary Mission | Toolbelt (available tools + when to use each) | Reasoning & Decision Strategy | Iteration & Self-Correction Protocol | Output & Reporting Protocol | Stop Conditions

CHAIN-OF-THOUGHT (CoT) → Role | Problem Framing | Explicit Reasoning Instructions | Mandatory Step Labels & Scaffolding | Self-Verification Step | Final Answer Format

CODE GENERATION → Role & Expertise | Codebase Context & Tech Stack Assumptions | Technical Requirements | Architecture & Design Principles | Implementation Plan (step-by-step) | Code Standards & Conventions | Error Handling & Edge Cases | Output Format & Deliverables

IMAGE / ART GENERATION → Subject & Scene Description | Art Style & Aesthetic | Lighting & Colour Palette | Composition & Framing | Mood & Atmosphere | Technical Parameters | Negative Prompt

AGENTIC DEV ENVIRONMENT → Role & Mission | Project Context & Tech Stack | Development Philosophy | Task Breakdown & Execution Order | File Operations & Code Standards | Testing & Verification Strategy | Output Protocol (what to create, where to save, what to report)

ROLEPLAY / PERSONA → Character Identity | Background & Backstory | Personality & Voice | Knowledge Domain | Interaction Rules & Behavioural Triggers | Boundaries & What to Stay In-Character About

DATA EXTRACTION / ANALYSIS → Role | Data Description & Source Format | Extraction / Analysis Rules | Output Schema (exact structure) | Quality Checks & Validation | Error Handling & Missing Data Protocol

Always include at least one section that introduces an expert insight or domain-specific best practice that the user did NOT mention in their rough idea.

═══════════════════════════════════════════════════════════════
DIRECTIVE 3 — TARGET LLM SYNTAX ADAPTATION
═══════════════════════════════════════════════════════════════

Adapt writing style and syntax precisely to the target model:

GPT-4o / GPT-4o mini:
- Use numbered lists and clear markdown headers (##, ###)
- "You must" and "You will" imperatives work well
- Keep section boundaries crisp and clearly labeled

Claude 3.5 Sonnet / Claude 3 Haiku:
- Wrap major structural sections in XML tags: <role>, <context>, <instructions>, <constraints>, <output_format>
- Claude responds well to explicit chain-of-thought guidance
- Be conversational but precise; Claude appreciates nuance

Gemini Pro / Gemini Flash:
- Use markdown headers and visual section separators (═══ or ---)
- Gemini handles dense, long-form instructions well
- Use explicit enumeration; label rules numerically

Llama 3 / Mistral:
- Keep structure simpler and more direct
- Avoid deeply nested or overly complex formats
- Use clear imperative language; these models do well with concise directives

Gemini Image Generation / ChatGPT Image Generation:
- Natural language description in flowing, vivid prose
- Describe subject, environment, art style, lighting, mood, and composition in rich detail
- For image-to-image use cases: clearly specify the reference image's role (style transfer, inpainting, variation, upscale, etc.) and what must be preserved vs. changed
- ChatGPT image gen responds well to scene-first descriptions followed by style direction
- Gemini image gen benefits from explicit colour palette, mood, and photographic/artistic context notes

Midjourney v6:
- /imagine prompt format with descriptive scene text
- Include parameter flags: --ar (aspect ratio), --v 6, --style (raw/cute/expressive), --q 2, --no (negatives)
- Use :: for concept weighting where needed
- For image-to-image: use --cref (character reference) or --sref (style reference) flags with source image URL

Stable Diffusion XL / Flux.1:
- Comma-separated weighted descriptors: (subject:1.3), (art style:1.2), (lighting:1.1)
- Include a structured Negative Prompt section
- Add quality boosters and technical parameters (steps, CFG scale, aspect ratio)
- For image-to-image: specify denoising strength and which elements to preserve

Agentic Development Environment:
- Explicit structured format: Thought → Action → Observation loop
- Clear file and directory operation instructions
- Modular task breakdown with verification steps after each major action

═══════════════════════════════════════════════════════════════
DIRECTIVE 4 — LENGTH, DETAIL & CREATIVE INNOVATION
═══════════════════════════════════════════════════════════════

- Target: 600–1200 words for the generated prompt
- Every section must be substantive — rich, specific, and immediately actionable
- Introduce at least 2–3 creative or expert-level design decisions the user did not specify — things a practitioner with deep domain knowledge would naturally include
- The prompt must be immediately copy-pasteable and produce excellent results without any further editing by the user

═══════════════════════════════════════════════════════════════
DIRECTIVE 5 — OUTPUT RULES (ABSOLUTE)
═══════════════════════════════════════════════════════════════

- Output ONLY the raw master prompt text
- Do NOT wrap in markdown code fences (\`\`\` blocks)
- Do NOT include any preamble such as "Here is your prompt:" or "I've created..."
- Do NOT include any meta-commentary or explanation after the prompt ends
- The very first character of your output must be the opening word of the generated prompt itself`;

/**
 * REFINE — Takes the existing generated prompt + user feedback and improves it.
 *
 * Design principles:
 *  - Surgical edits: only touch what the feedback targets
 *  - Preserve LLM syntax conventions from the original
 *  - Add high-quality domain-specific few-shot examples when requested
 *  - Output is always at least as comprehensive as the input
 */
const REFINE_SYSTEM_PROMPT = `You are an expert Prompt Critic and Iterative Refiner. You receive an existing engineered master prompt alongside specific user feedback on what to improve.

Your task: Produce a refined, improved version that addresses the feedback with expert precision.

═══════════════════════════════════════════════════════════════
REFINEMENT RULES
═══════════════════════════════════════════════════════════════

1. SURGICAL EDITS: Apply the feedback precisely. If only one section needs changing, do not rewrite unrelated sections — preserve what is already good.

2. ADD EXAMPLES: If feedback requests examples or few-shot demonstrations, introduce 2–3 high-quality, domain-specific, realistic examples in the most appropriate section. Never use vague placeholders — all examples must be concrete and immediately useful.

3. CONCISENESS: If feedback requests brevity, trim redundancy and padding — but never remove critical instructions, constraints, or key context.

4. IMPROVE QUALITY: If feedback is vague ("make it better"), scan the entire prompt and improve clarity, specificity, and actionability throughout. Strengthen weak or generic sections. Add anything a domain expert would consider obvious but is currently missing.

5. ADD SECTIONS: If feedback requests new content that warrants a new section (e.g. "add error handling"), insert it in the most logically appropriate position within the existing structure.

6. PRESERVE INTENT: Never alter the core task, persona, or fundamental purpose of the prompt unless explicitly requested.

7. MAINTAIN LLM STYLE: Keep all syntax conventions appropriate for the target LLM (XML tags for Claude, markdown headers for GPT/Gemini, SD weight syntax for image models, etc.).

8. LENGTH: The refined prompt must be at least as comprehensive as the original unless the feedback explicitly requests a shorter output.

═══════════════════════════════════════════════════════════════
OUTPUT RULES (ABSOLUTE)
═══════════════════════════════════════════════════════════════

- Output ONLY the refined prompt text
- No preamble ("Here is the refined version:"), no meta-commentary, no code fences
- Begin immediately with the first word of the refined prompt itself`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HistoryEntry {
    id: string;
    timestamp: number;
    persona: string;
    domain: string;
    targetLLM: string;
    promptType: string;
    roughIdea: string;
    output: string;
}

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------
const HISTORY_KEY = "lokrim_prompt_history";
const MAX_HISTORY = 20;

function loadHistory(): HistoryEntry[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) return JSON.parse(raw) as HistoryEntry[];
    } catch { /* ignore */ }
    return [];
}

function saveHistory(entries: HistoryEntry[]): void {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
    } catch { /* ignore */ }
}

function getLLMLabel(value: string): string {
    for (const group of TARGET_LLM_GROUPS) {
        const opt = group.options.find((o) => o.value === value);
        if (opt) return opt.label;
    }
    return value;
}

function getTypeLabel(value: string): string {
    return PROMPT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ---------------------------------------------------------------------------
// Input builders
// ---------------------------------------------------------------------------
function buildGenerateInput(
    persona: string,
    domain: string,
    targetLLM: string,
    promptType: string,
    roughIdea: string,
): string {
    const wordCount = roughIdea.trim().split(/\s+/).filter(Boolean).length;
    const expansionNote = wordCount < 30
        ? `\n⚠ SPARSE IDEA DETECTED (${wordCount} words). Apply DIRECTIVE 1 fully: autonomously invent a complete expert-level methodology anchored to the persona and domain. The output must be 600–1200 words of production-ready content.`
        : `\nApply all directives. Honour every detail in the rough idea while enriching with expert insights the user didn't mention.`;

    return `Generate a master prompt with the following specifications:

PERSONA / ROLE: ${persona}
DOMAIN / CONTEXT: ${domain.trim() || "Not specified — infer from the persona and rough idea, then define it clearly within the generated prompt"}
TARGET LLM: ${getLLMLabel(targetLLM)}
PROMPT TYPE: ${getTypeLabel(promptType)}

ROUGH IDEA:
${roughIdea}
${expansionNote}`;
}

function buildRefineInput(currentPrompt: string, feedback: string): string {
    return `EXISTING PROMPT:
${currentPrompt}

USER FEEDBACK:
${feedback}

Produce the refined version of the prompt now.`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PromptGenerator() {
    const [persona, setPersona] = useState("");
    const [domain, setDomain] = useState("");
    const [targetLLM, setTargetLLM] = useState("");
    const [promptType, setPromptType] = useState("");
    const [roughIdea, setRoughIdea] = useState("");
    const [outputPrompt, setOutputPrompt] = useState("");
    const [refineFeedback, setRefineFeedback] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [refineCount, setRefineCount] = useState(0);
    const [isCopied, setIsCopied] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    const pushHistory = (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
        const newEntry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...entry,
        };
        const updated = [newEntry, ...history].slice(0, MAX_HISTORY);
        setHistory(updated);
        saveHistory(updated);
    };

    const deleteHistoryEntry = (id: string) => {
        const updated = history.filter((e) => e.id !== id);
        setHistory(updated);
        saveHistory(updated);
    };

    const restoreHistoryEntry = (entry: HistoryEntry) => {
        setPersona(entry.persona);
        setDomain(entry.domain);
        setTargetLLM(entry.targetLLM);
        setPromptType(entry.promptType);
        setRoughIdea(entry.roughIdea);
        setOutputPrompt(entry.output);
        setRefineCount(0);
        setRefineFeedback("");
        setShowHistory(false);
        toast.success("Session restored from history.");
    };

    // -- Generate ------------------------------------------------------------
    const handleGenerate = async () => {
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
            const msg = err instanceof Error ? err.message : "Failed to generate prompt.";
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    // -- Refine --------------------------------------------------------------
    const handleRefine = async () => {
        if (!outputPrompt.trim()) { toast.error("Generate a prompt first."); return; }
        if (!refineFeedback.trim()) { toast.error("Enter refinement feedback."); return; }

        setIsRefining(true);
        try {
            const model = createGeminiModel({
                systemInstruction: REFINE_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.65 },
            });
            const result = await model.generateContent(buildRefineInput(outputPrompt, refineFeedback));
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
    };

    // -- Copy & Download -----------------------------------------------------
    const handleCopy = () => {
        if (!outputPrompt) { toast.error("Nothing to copy!"); return; }
        navigator.clipboard.writeText(outputPrompt);
        setIsCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
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
    };

    const isWorking = isGenerating || isRefining;

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
                                    onClick={() => restoreHistoryEntry(entry)}
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
                                        onClick={(e) => { e.stopPropagation(); deleteHistoryEntry(entry.id); }}
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
                        onClick={handleGenerate}
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
                                onClick={handleDownload}
                                disabled={!outputPrompt}
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs font-semibold">Download</span>
                            </button>
                            <button
                                onClick={handleCopy}
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
                                readOnly
                                value={outputPrompt}
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
                                        handleRefine();
                                    }
                                }}
                                placeholder="e.g. add few-shot examples, make it more concise, add error handling..."
                                className="flex-1 h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm"
                                disabled={isRefining}
                            />
                            <Button
                                onClick={handleRefine}
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
