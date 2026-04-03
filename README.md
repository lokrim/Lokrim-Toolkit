# lokrim.toolkit

A sleek, lightweight web application built for personal utility and knowledge management. Designed to run locally or be deployed via Firebase Hosting.

---

## Features

### Web to Obsidian Notes

A tool designed for knowledge hoarders and Obsidian users who want to capture web content cleanly.

- **Rich-Text Pasting**: Copy an entire webpage (`Cmd+A` then `Cmd+C`) and paste it directly into the converter. The tool automatically parses the HTML via Turndown, preserving all important hyperlinks (`[text](url)`) and image references (`![alt](url)`) rather than stripping them.
- **AI-Powered Structuring**: Uses the globally selected Gemini model to strip noisy web boilerplate (ads, navbars, footers, cookie banners), apply strict hierarchical Markdown formatting, and convert dense paragraphs into readable bullet points suitable for a personal knowledge vault.
- **Local History**: The last 30 conversions are stored in the browser's local storage so you can easily restore any past session.
- **Regenerate**: Retry AI generation with a single click if the initial structure isn't to your liking.

---

### Master Prompt Generator

Transforms a rough idea — even a single sentence — into a long, structured, immediately-usable master prompt tailored to any AI model or workflow type.

- **Intelligent Input Set**: Configure four parameters — Persona/Role, Domain/Context (optional), Target LLM, and Prompt Type — giving the generator precise context to build around.
- **Target LLM Awareness**: The generator adapts its output syntax to the selected model: XML tags for Claude, numbered markdown directives for GPT-4o, weighted descriptor syntax for Stable Diffusion/Flux, `/imagine` parameters for Midjourney, and structured action-observation loops for Agentic Development Environments.
- **Prompt Types**: Choose from System Prompt, User Task, Agent Task, Chain-of-Thought, Code Generation, Image/Art Generation, Agentic Development Environment, Roleplay/Persona, or Data Extraction/Analysis. Each type maps to a distinct structural template.
- **Idea Expansion**: If the rough idea is sparse (under ~30 words), the generator autonomously invents a complete expert-level methodology constrained by the persona and domain, filling every section substantively. Nothing is left as a placeholder.
- **Length and Innovation**: Targets 600–1200 words per generated prompt. Introduces at least 2–3 domain-specific expert insights the user did not specify.
- **Refine Loop**: After generation, a Refine strip appears below the output. Enter feedback (e.g. "add few-shot examples", "make it more concise", "add error handling") and hit Refine. A dedicated refinement system prompt applies changes surgically without altering the rest of the prompt. A badge tracks how many refinement passes have been applied.
- **Prompt History**: All generated sessions (up to 20) are persisted in local storage. The collapsible History panel in the header shows each entry with persona, domain, LLM, type, and rough idea preview. Clicking any entry fully restores all input fields and the output.
- **Download**: Export the generated prompt as a `.txt` file named after the persona.

---

### Universal PDF Pipeline

Merges diverse file formats into a single, perfectly ordered PDF document.

- **Hybrid Processing**: Native PDFs and images (`.png`, `.jpg`, `.webp`) are processed entirely in-browser using `pdf-lib` — zero network overhead, maximum privacy.
- **Office Document Support**: Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), and plain text (`.txt`) files are routed through ConvertAPI for pristine PDF rendering before merging. Requires a ConvertAPI Secret (configurable in Settings).
- **Drag and Drop Reordering**: Sort the pipeline array in any order using a drag-and-drop interface powered by `@hello-pangea/dnd`.

---

### GeoJSON Validator and Quick Mapper

Instantly visualises, validates, and extracts coordinates from GeoJSON data.

- **Live Parsing and Validation**: Paste or drag-and-drop `.json` files. The built-in editor validates syntax on the fly with precise error badges if the JSON is malformed.
- **Interactive Mapping**: Automatically fits the map view to the geometry bounds. Choose between OSM Standard, CartoDB Positron, or CartoDB Dark Matter tile layers, all responding to the global dark mode toggle.
- **Right-Click Coordinate Extraction**: Right-click anywhere on the map to open a popup that extracts the exact `lat, lng` to the clipboard.

---

### Scribe to Vault

A multi-pass AI pipeline that turns scanned handwritten PDFs into a single, clean, vault-ready `.md` file.

- **Multi-Pass Architecture**:
  - **Pass 1 — OCR**: Strict verbatim extraction of every word, table, and diagram from the PDF. PDFs over 7 pages are automatically chunked into 8-page batches, processed sequentially to avoid token-limit truncation, and stitched before the next pass.
  - **Pass 2 — Polish**: Converts the raw OCR transcript into structured GitHub-Flavored Markdown — an H1 title, hierarchical headings, proper GFM tables, and Obsidian `[!abstract]` callout placeholders with vivid diagram descriptions.
  - **Pass 3+ — Polish Further** (repeatable): A deep structural refinement pass that audits heading hierarchy, merges duplicates, perfects tables, improves definition clarity, and expands diagram callouts.
  - **Pass 4+ — Expand Notes** (repeatable): Enriches the document by adding definitions, worked examples with real values, real-world context callouts, and key caveats for any sparse or bare-label content — all without altering the original text.
- **Editable Output**: The final Markdown is displayed in an editable textarea. Rename the file before downloading (auto-derived from the H1 heading). Download as a `.md` file with one click.

---

### Bring Your Own Key (BYOK) Architecture

No backend user authentication is required to manage API credits or subscriptions. Click **Settings** in the bottom-left sidebar to:

- Paste your **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/)).
- Select your preferred **Gemini model** from the registry. All AI-powered tools automatically use whichever model is active. Available models: Gemini 3 Flash (default), Gemini 3.1 Flash Lite, Gemini 3.1 Pro, Gemini 2.5 Flash, Gemini 2.5 Pro.
- Paste your **ConvertAPI Secret** (required only for Office document conversion in the PDF Pipeline).

Keys are stored exclusively in the browser's `localStorage` and are never sent anywhere except directly to their respective providers.

---

## Live Demo

The application is live and free to use: [https://lokrim-toolkit.web.app](https://lokrim-toolkit.web.app)

### Quick Start

1. Open the app and click **Settings** (bottom-left sidebar).
2. Paste your **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/). It is stored only in your browser.
3. Select a **Gemini model** from the Model dropdown in Settings. Gemini 3 Flash is the default; use the lite model for Scribe to Vault for best OCR results.
4. Pick any tool from the sidebar and start using it.

---

## Developer Guide

### Project Architecture

```
src/
  App.tsx                    — Top-level router (auto-generates routes from toolsConfig)
  toolsConfig.ts             — Single source of truth for all tool registrations
  lib/
    gemini.ts                — Shared AI factory: model registry, BYOK key resolution, createGeminiModel()
    storage.ts               — Central localStorage schema: all key names live here
    pdfPipelineUtils.ts      — PDF merge/convert logic (shared lib for the PDF Pipeline tool)
    prompts/
      promptGenerator.ts     — System prompts + input builders for the Prompt Generator
      scribeToVault.ts       — System prompts for the Scribe to Vault pipeline
      markdownConverter.ts   — System prompt for the Web to Obsidian tool
  hooks/
    useLocalStorage.ts       — Typed localStorage hook with cross-tab sync
    usePromptGenerator.ts    — AI logic + history for the Prompt Generator tool
    useScribeToVault.ts      — Multi-pass AI pipeline for the Scribe to Vault tool
  pages/
    Home.tsx                 — Dashboard
    tools/
      MarkdownConverter.tsx  — Web to Obsidian Notes tool (view layer)
      PromptGenerator.tsx    — Master Prompt Generator tool (view layer)
      PdfPipeline.tsx        — Universal PDF Pipeline tool
      GeoJsonViewer.tsx      — GeoJSON Validator & Mapper tool
      ScribeToVault.tsx      — Scribe to Vault tool (view layer)
  components/
    ui/                      — shadcn/ui component library
  layouts/
    DashboardLayout.tsx      — Sidebar + content shell (auto-generates nav from toolsConfig)
```

### Shared Libraries

Only infrastructure that is genuinely shared across multiple tools belongs in `src/lib/`. The rule is: **if it is only used by one tool, it lives in that tool's files.**

#### `src/lib/gemini.ts`

Three responsibilities only:
1. **Model Registry** (`GEMINI_MODELS`, `DEFAULT_GEMINI_MODEL`, `GeminiModelId`) — add a new model here to make it appear in the Settings modal.
2. **API Key Resolution** (`getActiveApiKey()`) — reads the BYOK key from `localStorage` via `STORAGE_KEYS`, falls back to `VITE_GEMINI_API_KEY`, throws a user-friendly error if neither is present.
3. **Model Factory** (`createGeminiModel(options?)`) — combines the active key and selected model into a ready-to-use `GenerativeModel`.

#### `src/lib/storage.ts`

The **single source of truth** for all `localStorage` key names. Every file in the project imports key names from here — no raw string literals appear elsewhere. Adding a new key: add it here first. Renaming a key: keep the old key as a read-side fallback and add a migration path (documented in the file).

#### `src/lib/prompts/<toolName>.ts`

Each AI-powered tool has its own prompts file. System prompts and input-builder functions live here so they can be reviewed, versioned, and iterated independently of UI or hook code.

#### `src/hooks/useLocalStorage.ts`

A typed React hook for reading and writing `localStorage` with automatic JSON serialisation. Import it in any tool that needs persistent state.

---

### Adding a New Tool (5 Steps)

> **For non-AI tools** (like GeoJSON Viewer or PDF Pipeline): skip Steps 1–2 and put all logic directly in the component.

---

**Step 1 — Create prompt constants** *(AI tools only)*

Create `src/lib/prompts/yourTool.ts`. Export all system prompts and input-builder functions here. See `src/lib/prompts/promptGenerator.ts` for a template.

```ts
// src/lib/prompts/yourTool.ts

/**
 * MY_SYSTEM_PROMPT — role and task for the AI.
 * @temperature 0.7
 */
export const MY_SYSTEM_PROMPT = `You are a ...`;

/**
 * Builds the user-facing input message for the generate pass.
 */
export function buildInput(userText: string): string {
    return `Do the task with: ${userText}`;
}
```

Key rules for prompt files:
- Each exported prompt gets a JSDoc comment documenting its design principles and recommended temperature.
- Input builders are pure functions — no state, no side effects.
- Never import React or any UI library here.

---

**Step 2 — Create an AI hook** *(AI tools only)*

Create `src/hooks/useYourTool.ts`. Import your prompts from Step 1 and `createGeminiModel` from `@/lib/gemini`. All async AI calls, `useState`, and `localStorage` reads/writes go here.

```ts
// src/hooks/useYourTool.ts

import { useState } from "react";
import { toast } from "sonner";
import { createGeminiModel } from "@/lib/gemini";
import { STORAGE_KEYS } from "@/lib/storage";
import { MY_SYSTEM_PROMPT, buildInput } from "@/lib/prompts/yourTool";

export function useYourTool() {
    const [output, setOutput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function generate(userText: string) {
        setIsLoading(true);
        try {
            const model = createGeminiModel({
                systemInstruction: MY_SYSTEM_PROMPT,
                generationConfig: { temperature: 0.7 },
            });
            const result = await model.generateContent(buildInput(userText));
            setOutput(result.response.text());
            toast.success("Done!");
        } catch (err: unknown) {
            // getActiveApiKey() throws a user-friendly Error if no key is configured.
            // That message surfaces here via toast (crash-at-the-boundary pattern).
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    }

    return { output, isLoading, generate };
}
```

Key rules for hook files:
- Use `STORAGE_KEYS` from `@/lib/storage` for all localStorage key names — never raw strings.
- Use `createGeminiModel()` inside handlers, not at module load time.
- Expose a clean state object and named action functions — the component should never need to call `useState` for AI state.

---

**Step 3 — Build the tool component**

Create `src/pages/tools/YourTool.tsx`. Import and call your hook. The component is purely a **render layer** — no AI calls, no raw localStorage, no system prompts.

```tsx
// src/pages/tools/YourTool.tsx

import { useYourTool } from "@/hooks/useYourTool";

export default function YourTool() {
    const { output, isLoading, generate } = useYourTool();
    return (
        <div className="flex flex-col h-full w-full p-6 space-y-4">
            {/* render state, dispatch actions back to hook */}
        </div>
    );
}
```

Key rules for tool component files:
- Import UI state setters (e.g. `persona`, `roughIdea`) with `useState` in the component — only field-level UI state that has no effect outside the component.
- Never call `localStorage` directly in a component — use `useLocalStorage` or your custom hook.
- If your tool requires a new third-party API key, add a new input to `src/components/SettingsModal.tsx` and persist it to a new key in `src/lib/storage.ts`.

---

**Step 4 — Register the tool**

Open `src/toolsConfig.ts` and add a new entry to the `toolsConfig` array. Import your component and a `lucide-react` icon:

```ts
import YourTool from "@/pages/tools/YourTool";
import { Wrench } from "lucide-react";

// Add to the toolsConfig array:
{
    id: "your-tool",
    name: "Your Tool Name",
    path: "/tools/your-tool",
    icon: Wrench,
    component: YourTool,
    description: "One-sentence description for the Home dashboard card.",
    // Optional metadata:
    requiresGemini: true,
    tags: ["ai", "text"],
    status: "beta",
},
```

The router, sidebar, and dashboard update automatically — no other files need to change.

---

**Step 5 — Update the README**

Add a section under `## Features` in this file describing the new tool's capabilities.

---

### Theme and Styling Rules

To maintain the dark/light mode experience across all tools:

- **Never** write raw CSS element rules (e.g. `button {}`) in `index.css`. This overrides Tailwind class application.
- **Never** use inline React `style={{}}` overrides.
- **Always** use Tailwind's `dark:` variant classes directly on elements (e.g. `className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"`).
- Follow the existing zinc colour palette for neutral UI and purple (`dark:bg-purple-600`) for primary actions in dark mode.

### localStorage Schema

All `localStorage` key names are centralized in `src/lib/storage.ts`. The registry documents:
- The key name string
- The value type and shape
- The owning tool or shared library

**Never** use raw string literals for localStorage keys. Always import from `STORAGE_KEYS`.

### Running Tests

```bash
npm test          # Run all tests once (CI mode)
npm run test:watch  # Watch mode — re-runs on file changes
```

The test suite covers pure utility functions in `src/lib/`. Tests live in `src/lib/__tests__/`. Component and hook testing is in the backlog.

---

## Developer Installation

```bash
# Clone and install dependencies
npm install

# Optional: create a .env file for local fallback API keys
# VITE_GEMINI_API_KEY="your_gemini_key_here"
# VITE_CONVERT_API_KEY="your_convertapi_secret_here"

# Start the development server
npm run dev

# Run the test suite
npm test
```

---

## Deployment (Firebase CI/CD)

The project is fully configured as a Single Page Application for Firebase Hosting with GitHub Actions.

- Any push to the `main` branch automatically triggers `.github/workflows/firebase-hosting-merge.yml`.
- The action installs dependencies, builds the Vite production bundle, and deploys the `dist` folder to Firebase Hosting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI) + Lucide React icons |
| AI | `@google/generative-ai` SDK — `createGeminiModel()` in `src/lib/gemini.ts` |
| PDF Processing | `pdf-lib` (in-browser PDF creation, merging, chunking) |
| HTML Parsing | `turndown` (HTML to Markdown conversion) |
| Navigation | `react-router-dom` |
| Notifications | `sonner` |
| Drag and Drop | `@hello-pangea/dnd` + `react-dropzone` |
| Office Conversion | ConvertAPI |
| Maps | Leaflet + React-Leaflet |
| Testing | `vitest` |

---

## License

MIT
