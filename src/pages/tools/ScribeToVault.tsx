import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument, type PDFPage } from "pdf-lib";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Upload, Loader2, FileText, Download, RefreshCw,
    Copy, FileCheck2, Scan, CheckCircle2,
    AlertCircle, FilePenLine, WandSparkles, BookOpenText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const CHUNK_THRESHOLD = 7;  // pages — below this, send whole PDF in one shot
const CHUNK_SIZE = 8;       // pages per OCR batch when chunking is needed

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------
const OCR_SYSTEM_PROMPT = `You are a precision OCR engine. Extract every visible word from the provided PDF pages as plain text. This is not a formatting or summarisation task.

ABSOLUTE RULES:
1. VERBATIM: Transcribe every word, number, symbol, and label exactly as handwritten. Do not correct grammar, rephrase, or omit. If truly illegible, best-guess and append [?].
2. COMPLETENESS: Extract content from every page. Skipping or truncating is a critical failure.
3. PAGE MARKERS: Begin each page with: --- PAGE X --- (1-indexed within this chunk).
4. LAYOUT: Use line breaks to preserve visual structure. For side-by-side columns, output left first then right, each marked [LEFT COLUMN] / [RIGHT COLUMN].
5. TABLES/GRIDS: Output each row on its own line with cells separated by |. No Markdown syntax yet — raw cell content only.
6. DIAGRAMS: For any drawing or illustration, output: [DIAGRAM: <one detailed sentence — all labels, arrows, components, and layout>]
7. MATH: Use ^ for superscript, _ for subscript, and numerator/denominator for fractions.
8. OUTPUT ONLY the extracted text. Start immediately with --- PAGE 1 ---. No preamble.`;

const POLISH_SYSTEM_PROMPT = `You are a senior technical editor and GitHub-Flavored Markdown (GFM) specialist. You will receive a raw OCR transcript of handwritten academic or technical notes.

YOUR TASK: Convert the raw transcript into a single, clean, publication-quality GFM Markdown document for an Obsidian knowledge vault.

CONTENT RULES:
1. NO INVENTION: Do not add facts not in the raw text. If ambiguous, preserve as-is.
2. NO OMISSION: Every piece of information must appear in the output.
3. SPELLING (NARROW): Fix obvious OCR artifacts (e.g., "teh" → "the"). Preserve all technical terms, proper nouns, course codes, and domain vocabulary exactly.

STRUCTURE RULES:
4. H1 TITLE: The document must begin with exactly one H1 heading. Infer it from the most prominent heading or topic.
5. HEADINGS: Use ## for sections, ### for sub-sections — derived from natural breaks.
6. LISTS: Convert bullet-like text to proper GFM lists (- unordered, 1. ordered, preserving nesting).
7. REMOVE all --- PAGE X --- and --- CHUNK BREAK --- markers.

TABLE RULES (CRITICAL):
8. Any pipe-separated content or grid MUST become a valid GFM table:
   - Row 1: header; Row 2: | --- | --- |; subsequent rows: data.
   - Never leave cells empty — use - if absent. Never convert table data into prose.

DIAGRAM RULES:
9. Every [DIAGRAM: ...] MUST become this exact Obsidian callout — do not skip:
> [!abstract] Illustration Placeholder
> **Type:** [Flowchart | Architecture Diagram | Circuit | Graph | Sketch | Other]
> **Description:** [Vivid, specific description naming every component, arrow, label, and connection. Detailed enough to recreate the diagram.]

FORMATTING:
10. **Bold** key terms and definitions. \`inline code\` for identifiers and commands.
11. > blockquote for important highlighted notes or warnings.
12. One blank line between all headings, paragraphs, lists, tables, and blockquotes.

OUTPUT: Start with # H1. No code fence wrapper. No preamble like "Here is the document:".`;

const REFINE_SYSTEM_PROMPT = `You are an expert knowledge architect and technical writer specialising in Obsidian Markdown vaults. You will receive a Markdown document that has already been converted and formatted from handwritten notes. Your task is a deep, critical refinement pass.

WHAT TO DO:

1. STRUCTURAL AUDIT: Verify heading hierarchy is logical (# → ## → ###). Merge redundant or over-granular headings. Add missing headings for long unheaded sections. Ensure the H1 accurately reflects the whole document.

2. CONTENT COHERENCE: Merge duplicate or near-duplicate content. Reorder sections if a different sequence is more logical (e.g., prerequisites before dependent concepts). Add a single transitional sentence between sections only where the jump is abrupt.

3. TABLE PERFECTION: Re-examine all tables — ensure every cell is filled, headers are descriptive, and column alignment is consistent. If list items have multiple attributes per item, evaluate whether they should be a table instead.

4. DEFINITION CLARITY: For each bolded key term, ensure its definition appears clearly and immediately. If a term is defined elsewhere in the document, add a brief parenthetical definition at first use.

5. FORMATTING CONSISTENCY: Ensure **bold** is used only for key terms (not decoration). Ensure \`inline code\` is applied consistently for all technical identifiers. Remove stray symbols, double spaces, and broken list items.

6. ILLUSTRATION CALLOUTS: Review all [!abstract] Illustration Placeholder callouts. Expand their descriptions to be as detailed and specific as possible — add layout, labels, flow direction, and component descriptions.

WHAT NOT TO DO:
- Do NOT add information not in the input document.
- Do NOT remove substantive content.
- Do NOT change technical terms, proper nouns, or course-specific vocabulary.
- Do NOT wrap output in a code fence. Start directly with the # H1 heading. No preamble.`;

const EXPAND_SYSTEM_PROMPT = `You are an expert academic tutor and knowledge enrichment engine. You will receive a Markdown document of notes originally written as rough, concise handwritten notes. Because these are rough notes, they often lack definitions, context, examples, and supporting detail essential for genuine understanding.

YOUR TASK: Intelligently expand and enrich the document by filling knowledge gaps — WITHOUT altering, removing, or paraphrasing any original content.

PRIMARY DIRECTIVE:
- You are SUPPLEMENTING the notes, not replacing them. Every word of the original must remain exactly as-is.
- Only add content that is factually accurate, logically connected to what is already in the document, and genuinely useful to someone studying this topic.
- Do NOT hallucinate or invent facts. If uncertain about a detail, do not include it.

EXPANSION RULES:

1. DEFINITIONS: For every bolded key term, named concept, or section heading that lacks an explanation, add a clear and concise definition immediately after its first appearance.

2. EXAMPLES (CRITICAL): After each rule, algorithm, formula, concept, or process that lacks one, add one or two concrete, realistic, worked examples — use actual values, names, or scenarios, not vague placeholders. Label explicitly:
   **Example:** ...

3. CONTEXT AND MOTIVATION: For each major section (##), if the notes do not explain why this concept matters or where it is used in practice, add a real-world context note:
   > [!tip] Why This Matters
   > ...

4. ELABORATION ON SPARSE POINTS: If a bullet point is a bare label or a short fragment with nothing else, expand it into 2-4 sentences explaining what it is, how it works, and why it exists.

5. KEY POINTS AND CAVEATS: After each major section, if important related facts, common pitfalls, edge cases, or exam-relevant caveats are absent, add them under:
   **Key Points:**
   - ...

6. FORMULA EXPLANATIONS: For every formula or equation, add a sentence explaining what each variable means, what the formula computes, and when to apply it.

7. COMPARISON AND CONTRAST: If the notes mention two or more related terms side-by-side without a comparison, add a brief comparative explanation or a small difference table.

STRICT GUARDS:
- Do NOT remove, overwrite, or rephrase original content. Only ADD.
- Do NOT add entirely new sections on topics not already present in the notes.
- Preserve all original formatting: tables stay tables, callouts stay callouts.
- Output ONLY the enriched document. No preamble. Start with the # H1 heading. No code fence wrapper.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Stage = "idle" | "processing" | "refining" | "expanding" | "done";

interface LogEntry {
    text: string;
    status: "done" | "running" | "error";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getActiveApiKey(): string {
    let customKey = "";
    try {
        const stored = window.localStorage.getItem("lokrim_gemini_key");
        if (stored) customKey = JSON.parse(stored);
    } catch { /* ignore */ }
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    const activeKey = customKey || envKey;
    if (!activeKey) throw new Error("Gemini API key not found. Please add it in Settings (bottom-left sidebar).");
    return activeKey;
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Failed to read PDF file."));
        reader.readAsArrayBuffer(file);
    });
}

function deriveFilename(markdown: string, fallback: string): string {
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
        const title = h1Match[1].trim().replace(/[^\w\s\-()]/g, "").replace(/\s+/g, "_").slice(0, 80);
        if (title) return `${title}.md`;
    }
    return fallback;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ScribeToVault() {
    const [stage, setStage] = useState<Stage>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [progressLog, setProgressLog] = useState<LogEntry[]>([]);
    const [markdownOutput, setMarkdownOutput] = useState("");
    const [mdFilename, setMdFilename] = useState("");
    const [refineCount, setRefineCount] = useState(0);
    const [expandCount, setExpandCount] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    const addLog = (text: string, status: LogEntry["status"] = "done") =>
        setProgressLog((prev) => [...prev, { text, status }]);

    const updateLastLog = (text: string, status: LogEntry["status"] = "done") =>
        setProgressLog((prev) => {
            const updated = [...prev];
            if (updated.length > 0) updated[updated.length - 1] = { text, status };
            return updated;
        });

    // -- Drop zone -----------------------------------------------------------
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const dropped = acceptedFiles[0];
        if (!dropped) return;
        if (dropped.size > MAX_PDF_BYTES) {
            toast.error(`File too large (${(dropped.size / 1024 / 1024).toFixed(1)} MB). Max is 50 MB.`);
            return;
        }
        setFile(dropped);
        setStage("idle");
        setProgressLog([]);
        setMarkdownOutput("");
        setMdFilename("");
        setRefineCount(0);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    const handleReset = () => {
        setStage("idle");
        setProgressLog([]);
        setMarkdownOutput("");
        setMdFilename("");
        setRefineCount(0);
        setExpandCount(0);
    };

    // -- Pass 1 + 2: OCR → Polish (combined, no user intervention) -----------
    const handleTranscribe = async () => {
        if (!file) { toast.error("Please upload a PDF file first."); return; }
        let apiKey: string;
        try { apiKey = getActiveApiKey(); } catch (err: any) { toast.error(err.message); return; }

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

            const genAI = new GoogleGenerativeAI(apiKey);
            const ocrModel = genAI.getGenerativeModel({
                model: "gemini-3.1-flash-lite-preview",
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
                } catch (err: any) {
                    updateLastLog(`${label}: failed — ${err.message || "API error"}`, "error");
                    toast.error(`${label} failed and was skipped.`);
                }
            }

            if (ocrChunks.length === 0) {
                toast.error("All OCR batches failed. Please try again.");
                setStage("idle");
                return;
            }

            const rawOcr = ocrChunks.join("\n\n--- CHUNK BREAK ---\n\n");
            addLog(`OCR complete — ${ocrChunks.length}/${totalChunks} batch(es) succeeded.`, "done");

            // ── Phase 2: Polish ──────────────────────────────────────────────
            addLog("Polish pass: converting OCR text to GFM Markdown...", "running");
            const polishModel = genAI.getGenerativeModel({
                model: "gemini-3.1-flash-lite-preview",
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
        } catch (err: any) {
            console.error("Transcribe error:", err);
            toast.error(err.message || "An unexpected error occurred.");
            setStage("idle");
        }
    };

    // -- Pass 3+: Refinement (repeatable) ------------------------------------
    const handleRefine = async () => {
        if (!markdownOutput.trim()) { toast.error("No output to refine."); return; }
        let apiKey: string;
        try { apiKey = getActiveApiKey(); } catch (err: any) { toast.error(err.message); return; }

        setStage("refining");
        addLog(`Refinement pass ${refineCount + 1}: analysing and improving structure...`, "running");

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const refineModel = genAI.getGenerativeModel({
                model: "gemini-3.1-flash-lite-preview",
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
        } catch (err: any) {
            console.error("Refine error:", err);
            updateLastLog(`Refinement pass ${refineCount + 1}: failed`, "error");
            toast.error(err.message || "Refinement failed. Please try again.");
            setStage("done");
        }
    };

    // -- Expand: fill gaps with definitions, examples, context ---------------
    const handleExpand = async () => {
        if (!markdownOutput.trim()) { toast.error("No output to expand."); return; }
        let apiKey: string;
        try { apiKey = getActiveApiKey(); } catch (err: any) { toast.error(err.message); return; }

        setStage("expanding");
        addLog(`Expand pass ${expandCount + 1}: adding definitions, examples, and context...`, "running");

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const expandModel = genAI.getGenerativeModel({
                model: "gemini-3.1-flash-lite-preview",
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
        } catch (err: any) {
            console.error("Expand error:", err);
            updateLastLog(`Expand pass ${expandCount + 1}: failed`, "error");
            toast.error(err.message || "Expand failed. Please try again.");
            setStage("done");
        }
    };

    // -- Copy & Download -----------------------------------------------------
    const handleCopy = () => {
        if (!markdownOutput) { toast.error("Nothing to copy."); return; }
        navigator.clipboard.writeText(markdownOutput);
        setIsCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!markdownOutput) { toast.error("Nothing to download."); return; }
        const filename = (mdFilename.trim() || "notes.md").replace(/(?<!\.md)$/, "");
        const safeFilename = filename.endsWith(".md") ? filename : `${filename}.md`;
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
    };

    const isRunning = stage === "processing" || stage === "refining" || stage === "expanding";
    const showOutput = stage === "done" || stage === "refining" || stage === "expanding";

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <div className="flex flex-col w-full p-6 space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-col space-y-1.5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Scribe to Vault
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Multi-pass AI pipeline: OCR → polish → refine. One PDF, one clean&nbsp;.md file.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {(stage === "done") && (
                            <Button variant="outline" onClick={handleReset}
                                className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <RefreshCw className="mr-2 h-4 w-4" /> Start Over
                            </Button>
                        )}
                        {stage === "idle" && (
                            <Button onClick={handleTranscribe} disabled={!file}
                                className="bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-violet-600 dark:hover:bg-violet-500 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:opacity-100 px-6 font-medium transition-all shadow-sm">
                                <Scan className="mr-2 h-4 w-4" /> Transcribe Notes
                            </Button>
                        )}
                        {isRunning && (
                            <Button disabled className="bg-zinc-900 dark:bg-violet-600 text-zinc-50 px-6 font-medium opacity-75">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {stage === "processing" ? "Processing..." : stage === "refining" ? "Refining..." : "Expanding..."}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Drop Zone ── */}
            <div {...getRootProps()}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 shrink-0
                    ${isDragActive ? "border-violet-400 dark:border-violet-500 bg-violet-50/60 dark:bg-violet-900/10"
                        : file ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-900/10"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}>
                <input {...getInputProps()} />
                {file ? (
                    <>
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-lg shrink-0">
                            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB · Drag a new file to replace
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`p-2.5 rounded-lg shrink-0 ${isDragActive ? "bg-violet-100 dark:bg-violet-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                            <Upload className={`w-5 h-5 ${isDragActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-400"}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {isDragActive ? "Drop your PDF here" : "Drag & drop your scanned PDF"}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">.pdf only · max 50 MB</p>
                        </div>
                    </>
                )}
            </div>

            {/* ── Progress Log ── */}
            {progressLog.length > 0 && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm shrink-0">
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                        <Scan className="w-4 h-4" />
                        <span>Pipeline Log</span>
                    </div>
                    <div className="p-4 space-y-2 font-mono text-xs bg-white dark:bg-zinc-900/40">
                        {progressLog.map((entry, i) => (
                            <div key={i} className="flex items-start gap-2">
                                {entry.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />}
                                {entry.status === "running" && <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin shrink-0 mt-px" />}
                                {entry.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-px" />}
                                <span className={
                                    entry.status === "running" ? "text-zinc-800 dark:text-zinc-100 font-medium"
                                        : entry.status === "error" ? "text-red-600 dark:text-red-400"
                                            : "text-zinc-600 dark:text-zinc-400"
                                }>{entry.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Output Panel ── */}
            {showOutput && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    {/* Header row */}
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            <FilePenLine className="w-4 h-4" />
                            <span>Markdown Output</span>
                            {refineCount > 0 && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                                    Refined {refineCount}×
                                </span>
                            )}
                            {expandCount > 0 && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    Expanded {expandCount}×
                                </span>
                            )}
                            <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs">— editable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleExpand}
                                disabled={stage === "expanding" || stage === "refining"}
                                className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 dark:bg-amber-600 dark:hover:bg-amber-500 text-white disabled:opacity-50"
                            >
                                {stage === "expanding"
                                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Expanding...</>
                                    : <><BookOpenText className="mr-1.5 h-3 w-3" /> Expand Notes</>
                                }
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleRefine}
                                disabled={stage === "refining" || stage === "expanding"}
                                className="h-7 px-3 text-xs bg-zinc-900 hover:bg-zinc-900/80 dark:bg-violet-600 dark:hover:bg-violet-500 text-white disabled:opacity-50"
                            >
                                {stage === "refining"
                                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Refining...</>
                                    : <><WandSparkles className="mr-1.5 h-3 w-3" /> Polish Further</>
                                }
                            </Button>
                            <button onClick={handleCopy}
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                                {isCopied ? <FileCheck2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="text-xs font-semibold">{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Filename + download */}
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center gap-3">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">Filename:</span>
                        <input
                            type="text"
                            value={mdFilename}
                            onChange={(e) => setMdFilename(e.target.value)}
                            className="flex-1 text-xs font-mono bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500 transition-shadow"
                        />
                        <Button size="sm" onClick={handleDownload}
                            className="h-7 px-3 text-xs bg-zinc-900 hover:bg-zinc-900/90 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shrink-0">
                            <Download className="mr-1.5 h-3 w-3" /> Download .md
                        </Button>
                    </div>

                    {/* Editable markdown */}
                    <Textarea
                        value={markdownOutput}
                        onChange={(e) => setMarkdownOutput(e.target.value)}
                        className="min-h-96 p-4 bg-transparent border-0 resize-y font-mono text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 rounded-none focus-visible:ring-0"
                        placeholder="Polished Markdown will appear here..."
                    />
                </div>
            )}
        </div>
    );
}
