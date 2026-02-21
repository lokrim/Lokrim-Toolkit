import { useState } from "react";
import { Copy, Loader2, FileCheck2, Bot } from "lucide-react";
import { generateExpertPrompt } from "@/lib/gemini";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function PromptGenerator() {
    const [persona, setPersona] = useState<string>("");
    const [format, setFormat] = useState<string>("");
    const [roughIdea, setRoughIdea] = useState("");
    const [outputPrompt, setOutputPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!persona) {
            toast.error("Please select a Target Persona.");
            return;
        }
        if (!format) {
            toast.error("Please select a Desired Output Format.");
            return;
        }
        if (!roughIdea.trim()) {
            toast.error("Please enter a rough idea.");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateExpertPrompt(persona, format, roughIdea);
            setOutputPrompt(result);
            toast.success("Master prompt generated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to generate prompt.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!outputPrompt) {
            toast.error("Nothing to copy!");
            return;
        }

        navigator.clipboard.writeText(outputPrompt);
        setIsCopied(true);
        toast.success("Copied to clipboard!");

        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full w-full p-6 space-y-4">
            <div className="flex flex-col space-y-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Master Prompt Generator</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Transform rough ideas into highly optimized, professional prompts for AI models.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 min-w-0 flex flex-col lg:flex-row gap-6 pt-2">
                {/* Left Area: Configuration & Input */}
                <div className="w-full lg:w-1/2 flex flex-col min-h-0 min-w-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Persona</label>
                            <Select value={persona} onValueChange={setPersona}>
                                <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 h-10">
                                    <SelectValue placeholder="Select Persona" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Expert">Skip Persona (Default Expert)</SelectItem>
                                    <SelectItem value="Senior Full-Stack Developer">Senior Full-Stack Developer</SelectItem>
                                    <SelectItem value="Cybersecurity Analyst">Cybersecurity Analyst</SelectItem>
                                    <SelectItem value="AI/ML Engineer">AI/ML Engineer</SelectItem>
                                    <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                                    <SelectItem value="Product Manager">Product Manager</SelectItem>
                                    <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                                    <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                                    <SelectItem value="Technical Writer">Technical Writer</SelectItem>
                                    <SelectItem value="General Assistant">General Assistant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Desired Output Format</label>
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 h-10">
                                    <SelectValue placeholder="Select Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Code Blocks">Code Blocks</SelectItem>
                                    <SelectItem value="Step-by-Step Guide">Step-by-Step Guide</SelectItem>
                                    <SelectItem value="Markdown Document">Markdown Document</SelectItem>
                                    <SelectItem value="JSON Payload">JSON Payload</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40 focus-within:ring-1 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 transition-shadow">
                        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                            Rough Idea
                        </div>
                        <Textarea
                            value={roughIdea}
                            onChange={(e) => setRoughIdea(e.target.value)}
                            className="flex-1 p-4 bg-transparent border-0 outline-none resize-none font-mono text-sm leading-relaxed rounded-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            placeholder="e.g. setup auth middleware for express..."
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !roughIdea.trim() || !persona || !format}
                        className="w-full h-12 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:opacity-100 font-medium transition-all shadow-sm rounded-xl"
                    >
                        {isGenerating && !outputPrompt ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Engineering Prompt...
                            </>
                        ) : (
                            <>
                                <Bot className="mr-2 h-4 w-4" />
                                Generate Master Prompt
                            </>
                        )}
                    </Button>
                </div>

                {/* Right Area: Output */}
                <div className="w-full lg:w-1/2 flex flex-col min-h-0 min-w-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900/40">
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 font-medium text-sm flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                        <span>Engineered Output Prompt</span>
                        <button
                            onClick={handleCopy}
                            disabled={!outputPrompt}
                            className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCopied ? <FileCheck2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            <span className="text-xs font-semibold">{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                    </div>
                    <div className="flex-1 relative bg-transparent overflow-hidden flex flex-col">
                        {isGenerating && !outputPrompt ? (
                            <div className="absolute inset-0 p-4 space-y-3">
                                <Skeleton className="h-4 w-[80%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[60%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[90%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[75%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[85%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                                <Skeleton className="h-4 w-[40%] rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                            </div>
                        ) : (
                            <Textarea
                                readOnly
                                value={outputPrompt}
                                className="flex-1 w-full h-full p-4 border-0 outline-none resize-none font-mono text-sm leading-relaxed rounded-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 bg-transparent"
                                placeholder="Generated professional prompt will appear here..."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
