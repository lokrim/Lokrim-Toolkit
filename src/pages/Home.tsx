import { Wrench } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col h-full p-8 max-w-4xl mx-auto space-y-8 text-zinc-900 dark:text-zinc-50 pt-12">
            <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-xl shadow-sm">
                        <Wrench className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">lokrim.toolkit</h1>
                </div>
                <p className="text-lg text-zinc-500 dark:text-zinc-400">
                    A sleek, lightweight web application built for personal utility and knowledge management.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                {/* Available Tools */}
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm flex flex-col h-[520px]">
                    <h2 className="text-xl font-semibold mb-4 shrink-0">Available Tools</h2>

                    <div className="flex flex-col space-y-5 overflow-y-auto pr-2 pb-2 min-h-0">
                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Web to Obsidian Notes</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Paste full web articles directly into the tool. HTML is automatically parsed, preserving hyperlinks and image references via Turndown. The AI strips boilerplate and structures the content into clean, hierarchical Markdown ready for your Obsidian vault. Recent conversions are persisted in local history.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Master Prompt Generator</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Transform a rough idea — even a single sentence — into a long, battle-ready master prompt. Configure your target Persona, Domain/Context, Target LLM (GPT-4o, Claude, Gemini, Midjourney, SD, and more), and Prompt Type (System Prompt, Agent Task, CoT, Image Generation, Agentic Dev, etc.). The AI engineers a 600–1200 word structured prompt, inventing a complete methodology when the idea is sparse. Refine iteratively with written feedback. Full session history with one-click restore.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Universal PDF Pipeline</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Merge diverse file formats — PDFs, images, Word, Excel, PowerPoint, and plain text — into a single, perfectly ordered PDF. Native PDFs and images are processed entirely in-browser via <code>pdf-lib</code> for zero network overhead. Office documents are routed through ConvertAPI for pristine rendering before merging. Supports drag-and-drop reordering of the pipeline array.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">GeoJSON Validator & Mapper</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Paste or drag-and-drop GeoJSON data to instantly visualise and validate it on an interactive map. Live syntax checking surfaces malformed JSON with precise error badges. The map auto-fits to geometry bounds. Switch between OSM Standard, CartoDB Positron, and CartoDB Dark Matter tile layers. Right-click anywhere on the map to extract and copy exact lat/long coordinates to the clipboard.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Scribe to Vault</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Upload a scanned PDF of handwritten notes. A multi-pass AI pipeline runs verbatim OCR (chunked at 8 pages for large documents), converts the raw transcript into structured GitHub-Flavored Markdown, and offers repeatable Polish and Expand passes — polishing structure and enriching content with definitions, worked examples, and real-world context without altering originals. Edit, rename, and download the result as a single <code>.md</code> file.
                            </p>
                        </div>
                        
                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Flavour Forge</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                A high-performance recipe generator mapping your exact kitchen layout to gourmet realities. Uses Gemini to logic-check and map ingredient crossovers into detailed macros, while asynchronously blasting out high-grade cinematic visual renders via Pollinations AI natively. Caches your unique kitchen equipment permanently while keeping your session output completely immune to accidental tab switches using session-local recovery.
                            </p>
                        </div>
                    </div>
                </div>

                {/* How to Use */}
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm flex flex-col h-[520px]">
                    <h2 className="text-xl font-semibold mb-4 shrink-0">How to Use</h2>

                    <div className="flex flex-col space-y-4 overflow-y-auto pr-2 pb-2 min-h-0">
                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">1. Configure your API Key</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Click <strong className="text-zinc-800 dark:text-zinc-200">Settings</strong> in the bottom-left sidebar. Paste your free <strong className="text-zinc-800 dark:text-zinc-200">Google Gemini API Key</strong> (from{" "}
                                <a
                                    href="https://aistudio.google.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2"
                                >
                                    Google AI Studio
                                </a>
                                ). The key is stored only in your browser's local storage and is never sent anywhere except directly to Google's API.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">2. Select a Gemini Model</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Inside Settings, use the <strong className="text-zinc-800 dark:text-zinc-200">Model</strong> dropdown to choose your preferred Gemini model — Gemini 3 Flash (default), Gemini 3.1 Flash Lite, Gemini 3.1 Pro, Gemini 2.5 Flash, or Gemini 2.5 Pro. All AI-powered tools automatically pick up whichever model is selected. For Scribe to Vault, the lite model tends to give the best OCR results.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">3. Pick a tool and go</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Select any tool from the sidebar on the left. AI-powered tools (Web to Obsidian, Prompt Generator, Scribe to Vault) consume your Gemini key. The PDF Pipeline and GeoJSON Mapper work entirely offline unless you use Office file conversion (which requires a ConvertAPI key, also configurable in Settings).
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Privacy & Session State</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                No user accounts, no server-side storage, no telemetry. Every key and historical recipe lives exclusively in your browser's local storage. Crucially, your active runtime inputs (like an unsaved generated prompt or mid-generation recipe) are securely cached via <code>useSessionStorage</code>. Switching between tools retains your state flawlessly, but automatically vanishes exactly when the browser tab closes.
                            </p>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Contributing a Tool</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                New tools follow a strict functional pattern: create prompt constants → build an AI hook leveraging <code>useSessionStorage</code> for active state retention → build the view component → register in <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">toolsConfig.ts</code>. See the <strong className="text-zinc-800 dark:text-zinc-200">Developer Guide</strong> in the README for the full workflow with code templates.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="pt-12 mt-auto border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                Created by{" "}
                <a
                    href="https://github.com/lokrim"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline"
                >
                    lokrim
                </a>
                . Open-source personal utilities targeting minimal design & local privacy.
            </div>
        </div>
    );
}
