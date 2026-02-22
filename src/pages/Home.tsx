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
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm flex flex-col h-[450px]">
                    <h2 className="text-xl font-semibold mb-4 shrink-0">Available Tools</h2>

                    <div className="flex flex-col space-y-5 overflow-y-auto pr-2 pb-2 min-h-0">
                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Web to Obsidian Notes</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Paste whole web articles directly into the application. The tool automatically parses HTML, preserving all important hyperlinks and image references. It uses AI to intelligently strip noisy web boilerplate and structure the content into clean, standard Markdown.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Prompt Generator</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Transform rough, informal ideas into highly detailed, professional master prompts. Configure your target persona and desired output format, and let AI engineer the perfect prompt system instruction for you.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Universal PDF Pipeline</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Merge diverse file formats (PDFs, Images, Office Docs, Text) into a single, perfectly ordered PDF document. Utilizes intelligent local browser processing for maximum privacy and speed.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">GeoJSON Validator & Mapper</strong>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                Paste or drag-and-drop GeoJSON data to instantly view and validate it on an interactive map. Features live syntax checking, right-click coordinate extraction, and seamless TileLayer swapping.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm flex flex-col space-y-3">
                    <h2 className="text-xl font-semibold">How to Use</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        <strong className="text-zinc-900 dark:text-zinc-100">Bring Your Own Key (BYOK)</strong><br />
                        No backend user authentication is required. Click the <strong>Settings</strong> menu in the bottom-left sidebar to securely paste your own Google Gemini API Key. The key is stored safely in your browser's local storage and is never sent anywhere except directly to Google's API to ensure your quota remains private.
                    </p>
                </div>
            </div>

            <div className="pt-12 mt-auto border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                Created by <a href="https://github.com/lokrim" target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline">lokrim</a>. Open-source personal utilities targeting minimal design & local privacy.
            </div>
        </div>
    );
}
