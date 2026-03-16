import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DropResult,
} from "@hello-pangea/dnd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { PDFDocument, type PDFPage } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Upload,
    Loader2,
    FileText,
    Download,
    GripVertical,
    RefreshCw,
    Package,
    Inbox,
    CheckSquare,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Topic {
    id: string;
    filename: string;
    content: string;
}

interface KanbanColumns {
    generated: string[];
    ready: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB — Gemini inline data limit for PDFs
const CHUNK_SIZE = 3; // Pages per Gemini request — keeps output well within the 8192 token limit

const scribeSchema = {
    type: SchemaType.ARRAY,
    description: "An array of topics extracted from the handwritten notes.",
    items: {
        type: SchemaType.OBJECT,
        properties: {
            filename: {
                type: SchemaType.STRING,
                description:
                    "A logical filename for the topic, e.g., 'Database_Normalization.md'",
            },
            content: {
                type: SchemaType.STRING,
                description:
                    "The highly structured, GitHub-Flavored Markdown content of the topic.",
            },
        },
        required: ["filename", "content"],
    },
};

const SYSTEM_INSTRUCTION = `You are a strict, verbatim OCR transcription engine and Markdown formatter. You will be provided with a chunk of a handwritten PDF.

YOUR PRIMARY DIRECTIVE: Transcribe the handwritten text EXACTLY as written, word-for-word. DO NOT summarize, DO NOT paraphrase, and DO NOT omit any text.

1. VERBATIM MARKDOWN: Convert the visual layout (headings, bullet points) into clean GitHub-Flavored Markdown. Output as one continuous block of text.
2. STRICT TABLES (CRITICAL): If you detect a hand-drawn grid or matrix, you MUST convert it into a valid Markdown table using pipe syntax (e.g., | Header 1 | Header 2 |). Do not just mash the words together.
3. ILLUSTRATIONS/DIAGRAMS: If you detect an architecture diagram, sketch, or complex illustration, replace it entirely with an Obsidian-style callout in this exact format:
> [!abstract] Illustration Placeholder
> **Type:** [e.g., Flowchart, Architecture Diagram]
> **Description:** [Highly detailed visual description.]
4. SPELL CHECK: After transcribing, silently correct obvious spelling errors (e.g., "teh" → "the"). Preserve intentional abbreviations, technical terms, and proper nouns unchanged.`;

// --------------------------------------------------------------------ew-------
// Helpers
// ---------------------------------------------------------------------------
function getActiveApiKey(): string {
    let customKey = "";
    try {
        const stored = window.localStorage.getItem("lokrim_gemini_key");
        if (stored) {
            customKey = JSON.parse(stored);
        }
    } catch {
        // ignore parse errors
    }
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    const activeKey = customKey || envKey;
    if (!activeKey) {
        throw new Error(
            "Gemini API key not found. Please add it in Settings (bottom-left sidebar)."
        );
    }
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

// ---------------------------------------------------------------------------
// Kanban Card Component
// ---------------------------------------------------------------------------
interface TopicCardProps {
    topic: Topic;
    index: number;
}

function TopicCard({ topic, index }: TopicCardProps) {
    return (
        <Draggable draggableId={topic.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                        rounded-xl border bg-white dark:bg-zinc-900
                        shadow-sm transition-shadow mb-3
                        ${snapshot.isDragging
                            ? "shadow-xl border-violet-400 dark:border-violet-500 rotate-1"
                            : "border-zinc-200 dark:border-zinc-800 hover:shadow-md"
                        }
                    `}
                >
                    {/* Card Header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 rounded-t-xl">
                        <div
                            {...provided.dragHandleProps}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing shrink-0"
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <FileText className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate font-mono">
                            {topic.filename}
                        </span>
                    </div>

                    {/* Markdown Preview */}
                    <div className="p-3 max-h-64 overflow-y-auto text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 prose prose-zinc dark:prose-invert prose-xs max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {topic.content}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

// ---------------------------------------------------------------------------
// Droppable Column Component
// ---------------------------------------------------------------------------
interface KanbanColumnProps {
    columnId: "generated" | "ready";
    title: string;
    icon: React.ReactNode;
    cardIds: string[];
    topicsMap: Map<string, Topic>;
    accentClass: string;
    headerAction?: React.ReactNode;
    emptyMessage: string;
}

function KanbanColumn({
    columnId,
    title,
    icon,
    cardIds,
    topicsMap,
    accentClass,
    headerAction,
    emptyMessage,
}: KanbanColumnProps) {
    return (
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl border border-b-0 ${accentClass}`}>
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-semibold">{title}</span>
                    <span className="text-xs font-medium tabular-nums bg-white/60 dark:bg-zinc-900/60 rounded-full px-2 py-0.5">
                        {cardIds.length}
                    </span>
                </div>
                {headerAction}
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                            flex-1 min-h-48 p-3 rounded-b-xl border border-t-0 overflow-y-auto transition-colors
                            ${accentClass.replace("border-", "border-t-zinc-200 dark:border-t-zinc-800 border-")}
                            ${snapshot.isDraggingOver
                                ? "bg-violet-50/60 dark:bg-violet-900/10"
                                : "bg-zinc-50/40 dark:bg-zinc-900/20"
                            }
                        `}
                    >
                        {cardIds.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-zinc-400 dark:text-zinc-600 text-xs text-center gap-2">
                                <Inbox className="w-6 h-6 opacity-50" />
                                {emptyMessage}
                            </div>
                        ) : (
                            cardIds.map((id, index) => {
                                const topic = topicsMap.get(id);
                                if (!topic) return null;
                                return (
                                    <TopicCard
                                        key={topic.id}
                                        topic={topic}
                                        index={index}
                                    />
                                );
                            })
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Tool Component
// ---------------------------------------------------------------------------
export default function ScribeToVault() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState("");
    const [topics, setTopics] = useState<Topic[]>([]);
    const [columns, setColumns] = useState<KanbanColumns>({
        generated: [],
        ready: [],
    });

    // Derived: fast O(1) lookup map
    const topicsMap = new Map(topics.map((t) => [t.id, t]));

    // -----------------------------------------------------------------------
    // File Handling
    // -----------------------------------------------------------------------
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const dropped = acceptedFiles[0];
        if (!dropped) return;
        if (dropped.size > MAX_PDF_BYTES) {
            toast.error(
                `File too large (${(dropped.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 50 MB.`
            );
            return;
        }
        setFile(dropped);
        // Clear any previous results when a new file is selected
        setTopics([]);
        setColumns({ generated: [], ready: [] });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    // -----------------------------------------------------------------------
    // Gemini API Call
    // -----------------------------------------------------------------------
    const handleTranscribe = async () => {
        if (!file) {
            toast.error("Please upload a PDF file first.");
            return;
        }

        let apiKey: string;
        try {
            apiKey = getActiveApiKey();
        } catch (err: any) {
            toast.error(err.message);
            return;
        }

        setIsProcessing(true);
        setProcessingProgress("Loading PDF...");
        setTopics([]);
        setColumns({ generated: [], ready: [] });

        try {
            // ── Step 1: Load original PDF via pdf-lib ──────────────────────
            const arrayBuffer = await fileToArrayBuffer(file);
            const originalPdf = await PDFDocument.load(arrayBuffer);
            const totalPages = originalPdf.getPageCount();
            const totalChunks = Math.ceil(totalPages / CHUNK_SIZE);

            // ── Step 2: Initialise Gemini model once, reuse across chunks ──
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: SYSTEM_INSTRUCTION,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: scribeSchema as any,
                    maxOutputTokens: 8192,
                    temperature: 0.1,
                },
            });

            // ── Step 3: Sequential chunked processing ─────────────────────
            const allParsedTopics: { filename: string; content: string }[] = [];

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const startPage = chunkIndex * CHUNK_SIZE;          // 0-indexed
                const endPage = Math.min(startPage + CHUNK_SIZE, totalPages); // exclusive
                const humanStart = startPage + 1;
                const humanEnd = endPage;

                setProcessingProgress(
                    `Transcribing pages ${humanStart}–${humanEnd} of ${totalPages} (chunk ${chunkIndex + 1}/${totalChunks})...`
                );

                // Build a sub-PDF for this page range
                const chunkPdf = await PDFDocument.create();
                const pageIndices = Array.from(
                    { length: endPage - startPage },
                    (_, i) => startPage + i
                );
                const copiedPages = await chunkPdf.copyPages(originalPdf, pageIndices);
                copiedPages.forEach((page: PDFPage) => chunkPdf.addPage(page));
                const base64Data = await chunkPdf.saveAsBase64();

                // Call Gemini for this chunk
                let responseText: string;
                try {
                    const result = await model.generateContent([
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: base64Data,
                            },
                        },
                        "Please transcribe and structure these handwritten notes into topic-wise Markdown files.",
                    ]);
                    responseText = result.response.text();
                } catch (apiErr: any) {
                    // API-level failure for a single chunk: warn and skip
                    toast.error(`Chunk ${chunkIndex + 1} (pages ${humanStart}–${humanEnd}) failed: ${apiErr.message || "API error"}. Skipping.`);
                    continue;
                }

                // Parse chunk response — failure skips this chunk, never crashes
                try {
                    const parsed = JSON.parse(responseText);
                    if (Array.isArray(parsed)) {
                        allParsedTopics.push(...parsed);
                    }
                } catch {
                    toast.error(`Chunk ${chunkIndex + 1} (pages ${humanStart}–${humanEnd}) returned malformed JSON and was skipped.`);
                }
            }

            // ── Step 4: Stitch all chunks into a single Markdown file ─────
            if (allParsedTopics.length === 0) {
                toast.error("No topics could be extracted. All chunks may have failed — try a smaller PDF.");
                return;
            }

            // Join every chunk's content with a horizontal rule separator,
            // then apply the double-escaped newline fix in one pass.
            const stitchedContent = allParsedTopics
                .map((item) => (item.content || ""))
                .join("\n\n---\n\n")
                .replace(/\\n/g, "\n");

            // Derive filename from the uploaded file (e.g. "Acoa-ILP.pdf" → "Acoa-ILP.md")
            const mdFilename = file.name.replace(/\.pdf$/i, ".md");

            const singleTopic: Topic = {
                id: `topic-${Date.now()}-0`,
                filename: mdFilename,
                content: stitchedContent,
            };

            setTopics([singleTopic]);
            setColumns({
                generated: [singleTopic.id],
                ready: [],
            });

            toast.success(`Transcribed ${totalPages} page${totalPages !== 1 ? "s" : ""} across ${totalChunks} chunk${totalChunks !== 1 ? "s" : ""} → 1 Markdown file.`);
        } catch (err: any) {
            console.error("Scribe to Vault error:", err);
            toast.error(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress("");
        }
    };

    // -----------------------------------------------------------------------
    // Kanban Drag & Drop
    // -----------------------------------------------------------------------
    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return;

        const srcCol = source.droppableId as "generated" | "ready";
        const dstCol = destination.droppableId as "generated" | "ready";

        setColumns((prev) => {
            const srcIds = Array.from(prev[srcCol]);
            const dstIds = srcCol === dstCol ? srcIds : Array.from(prev[dstCol]);

            const [movedId] = srcIds.splice(source.index, 1);
            dstIds.splice(destination.index, 0, movedId);

            return {
                ...prev,
                [srcCol]: srcIds,
                [dstCol]: srcCol === dstCol ? srcIds : dstIds,
            };
        });
    };

    // -----------------------------------------------------------------------
    // Download Zip
    // -----------------------------------------------------------------------
    const handleDownloadReady = async () => {
        if (columns.ready.length === 0) {
            toast.error('No cards in "Ready to Export". Drag some topics there first.');
            return;
        }

        const zip = new JSZip();
        for (const id of columns.ready) {
            const topic = topicsMap.get(id);
            if (!topic) continue;
            const safeFilename = topic.filename.endsWith(".md")
                ? topic.filename
                : `${topic.filename}.md`;
            zip.file(safeFilename, topic.content);
        }

        try {
            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, `scribe-to-vault-${Date.now()}.zip`);
            toast.success(`Downloaded ${columns.ready.length} file${columns.ready.length !== 1 ? "s" : ""} as .zip`);
        } catch {
            toast.error("Failed to generate zip archive. Please try again.");
        }
    };

    const hasResults = topics.length > 0;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="flex flex-col h-full w-full p-6 space-y-4">

            {/* ── Page Header ── */}
            <div className="flex flex-col space-y-1.5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Scribe to Vault
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Upload a scanned PDF of handwritten notes. Gemini AI will transcribe and chunk them into topic-wise Markdown files ready for your Obsidian vault.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                        {hasResults && (
                            <Button
                                variant="outline"
                                onClick={handleTranscribe}
                                disabled={isProcessing}
                                className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
                                Re-transcribe
                            </Button>
                        )}
                        <Button
                            onClick={handleTranscribe}
                            disabled={isProcessing || !file}
                            className="bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-violet-600 dark:text-zinc-50 dark:hover:bg-violet-500 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:opacity-100 px-6 font-medium transition-all shadow-sm"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Transcribing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Transcribe Notes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── File Drop Zone ── */}
            <div
                {...getRootProps()}
                className={`
                    relative flex flex-col items-center justify-center gap-3
                    px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer
                    transition-all duration-200 shrink-0
                    ${isDragActive
                        ? "border-violet-400 dark:border-violet-500 bg-violet-50/60 dark:bg-violet-900/10"
                        : file
                            ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-900/10"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }
                `}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-lg">
                            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{file.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB · Click or drag to replace
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`p-3 rounded-xl ${isDragActive ? "bg-violet-100 dark:bg-violet-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                            <Upload className={`w-6 h-6 ${isDragActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-400"}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {isDragActive ? "Drop your PDF here" : "Drag & drop your scanned PDF"}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                or click to browse · .pdf only · max 50 MB
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* ── Loading State ── */}
            {isProcessing && (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-zinc-500 dark:text-zinc-400 shrink-0">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    <div className="text-center">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {processingProgress || "Preparing..."}
                        </p>
                        <p className="text-xs mt-0.5 text-zinc-400 dark:text-zinc-500">
                            Each chunk takes ~15–30 s. Please keep this tab active.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Kanban Board ── */}
            {hasResults && !isProcessing && (
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Drag topics between columns to curate your export
                        </p>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex gap-5 flex-1 min-h-0">

                            {/* Generated Topics column */}
                            <KanbanColumn
                                columnId="generated"
                                title="Generated Topics"
                                icon={<Package className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
                                cardIds={columns.generated}
                                topicsMap={topicsMap}
                                accentClass="border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                                emptyMessage="All topics have been moved to 'Ready to Export'."
                            />

                            {/* Ready to Export column */}
                            <KanbanColumn
                                columnId="ready"
                                title="Ready to Export"
                                icon={<CheckSquare className="w-4 h-4 text-violet-500 dark:text-violet-400" />}
                                cardIds={columns.ready}
                                topicsMap={topicsMap}
                                accentClass="border-violet-200 dark:border-violet-800/60 bg-violet-50/80 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                                emptyMessage="Drag topics here to queue them for download."
                                headerAction={
                                    <Button
                                        size="sm"
                                        onClick={handleDownloadReady}
                                        disabled={columns.ready.length === 0}
                                        className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white dark:bg-violet-600 dark:hover:bg-violet-500 disabled:opacity-40"
                                    >
                                        <Download className="mr-1.5 h-3 w-3" />
                                        Download All Ready
                                    </Button>
                                }
                            />
                        </div>
                    </DragDropContext>
                </div>
            )}
        </div>
    );
}
