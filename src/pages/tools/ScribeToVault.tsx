import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Upload, Loader2, FileText, Download, RefreshCw,
    Copy, FileCheck2, Scan, CheckCircle2,
    AlertCircle, FilePenLine, WandSparkles, BookOpenText,
} from "lucide-react";
import { useScribeToVault } from "@/hooks/useScribeToVault";

/**
 * Scribe to Vault — view layer.
 *
 * All AI pipeline logic, stage management, progress logging, and file I/O
 * is handled by `useScribeToVault`. This component is purely responsible
 * for rendering state and dispatching actions back to the hook.
 */
export default function ScribeToVault() {
    const {
        state,
        acceptFile,
        transcribe,
        refine,
        expand,
        reset,
        copyToClipboard,
        download,
        setMarkdownOutput,
        setMdFilename,
    } = useScribeToVault();

    const {
        stage, file, progressLog, markdownOutput, mdFilename,
        refineCount, expandCount, isCopied, isRunning, showOutput,
    } = state;

    // Connect react-dropzone — validation and state update handled by hook
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const dropped = acceptedFiles[0];
        if (dropped) acceptFile(dropped);
    }, [acceptFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

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
                            Multi-pass AI pipeline: OCR → polish → refine. One PDF, one clean&nbsp;.md file. Use the lite model for better results
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {(stage === "done") && (
                            <Button variant="outline" onClick={reset}
                                className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <RefreshCw className="mr-2 h-4 w-4" /> Start Over
                            </Button>
                        )}
                        {stage === "idle" && (
                            <Button onClick={transcribe} disabled={!file}
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
                                onClick={expand}
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
                                onClick={refine}
                                disabled={stage === "refining" || stage === "expanding"}
                                className="h-7 px-3 text-xs bg-zinc-900 hover:bg-zinc-900/80 dark:bg-violet-600 dark:hover:bg-violet-500 text-white disabled:opacity-50"
                            >
                                {stage === "refining"
                                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Refining...</>
                                    : <><WandSparkles className="mr-1.5 h-3 w-3" /> Polish Further</>
                                }
                            </Button>
                            <button onClick={copyToClipboard}
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
                        <Button size="sm" onClick={() => download(mdFilename)}
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
