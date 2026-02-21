import { useState } from "react";
import { Copy, Loader2, FileCheck2, RefreshCw, Clock, ChevronRight } from "lucide-react";
import { convertTextToMarkdown } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import TurndownService from "turndown";

interface HistoryItem {
    id: string;
    raw: string;
    markdown: string;
    date: number;
}

export default function MarkdownConverter() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [isConverting, setIsConverting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [history, setHistory] = useLocalStorage<HistoryItem[]>("lokrim_markdown_history", []);

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const html = e.clipboardData.getData("text/html");
        if (html) {
            e.preventDefault();
            try {
                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    codeBlockStyle: 'fenced'
                });
                const markdown = turndownService.turndown(html);

                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newText = inputText.substring(0, start) + markdown + inputText.substring(end);

                setInputText(newText);

                // Let the browser finish the cycle before updating cursor position if needed,
                // but since it's a controlled component it will jump to end, which is usually fine 
                // for pasting large blocks of text.
                toast.success("Rich text detected: Preserved links and images!");
            } catch (err) {
                console.error("Failed to parse HTML from clipboard", err);
                // Fallback to default plain text paste
            }
        }
    };

    const handleConvert = async (forceRegenerate = false) => {
        if (!inputText.trim()) {
            toast.error("Please enter some text to convert.");
            return;
        }

        setIsConverting(true);
        try {
            const markdown = await convertTextToMarkdown(inputText);
            setOutputText(markdown);
            toast.success(forceRegenerate ? "Regenerated successfully!" : "Web page successfully structured for Obsidian!");

            const newItem: HistoryItem = {
                id: Date.now().toString(),
                raw: inputText,
                markdown: markdown,
                date: Date.now()
            };

            setHistory(prev => {
                const newHistory = [newItem, ...prev.filter(item => item.raw !== inputText)];
                return newHistory.slice(0, 3);
            });

        } catch (error: any) {
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsConverting(false);
        }
    };

    const handleCopy = () => {
        if (!outputText) {
            toast.error("Nothing to copy!");
            return;
        }

        navigator.clipboard.writeText(outputText);
        setIsCopied(true);
        toast.success("Copied to clipboard!");

        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setInputText(item.raw);
        setOutputText(item.markdown);
        toast.info("Loaded from history.");
    };

    return (
        <div className="flex flex-col h-full w-full p-6 space-y-4">
            <div className="flex flex-col space-y-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Web to Obsidian Notes</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Paste whole web articles. Links and images will be preserved and AI will structure it for your vault.
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        {outputText && (
                            <Button
                                variant="outline"
                                onClick={() => handleConvert(true)}
                                disabled={isConverting || !inputText.trim()}
                                className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${isConverting ? "animate-spin" : ""}`} />
                                Regenerate
                            </Button>
                        )}
                        <Button
                            onClick={() => handleConvert()}
                            disabled={isConverting || !inputText.trim()}
                            className="bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:opacity-100 px-8 font-medium transition-all shadow-sm"
                        >
                            {isConverting && !outputText ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Structuring...
                                </>
                            ) : (
                                "Structure for Obsidian"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 min-w-0 flex flex-col lg:flex-row gap-6 pt-2">
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                    {/* Left Area: Input */}
                    <div className="flex flex-col min-h-0 min-w-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 transition-shadow">
                        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                            Raw Article / Text
                        </div>
                        <Textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onPaste={handlePaste}
                            className="flex-1 p-4 bg-transparent border-0 outline-none resize-none font-mono text-sm leading-relaxed rounded-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            placeholder="Cmd+A, Cmd+C on a website, then Paste here..."
                        />
                    </div>

                    {/* Middle Area: Output */}
                    <div className="flex flex-col min-h-0 min-w-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40">
                        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                            <span>Obsidian Markdown</span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                            >
                                {isCopied ? <FileCheck2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="text-xs font-semibold">{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                        <Textarea
                            readOnly
                            value={outputText}
                            className="flex-1 p-4 bg-transparent border-0 outline-none resize-none font-mono text-sm leading-relaxed rounded-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100"
                            placeholder="Output will appear here..."
                        />
                    </div>
                </div>

                {/* Right Area: History Sidebar */}
                <div className="w-full lg:w-72 xl:w-80 flex flex-col min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40">
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-4 h-4" />
                        <span>Recent Conversions</span>
                    </div>
                    <div className="flex-1 overflow-auto p-3 space-y-2">
                        {history.length === 0 ? (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-8">
                                Your last 3 conversions will appear here.
                            </div>
                        ) : (
                            history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => loadHistoryItem(item)}
                                    className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 font-mono leading-relaxed opacity-80 group-hover:opacity-100">
                                        {item.raw}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
