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

The application is built for maximum scalability — adding a new tool requires touching only three files and creating one new component.

```
src/
  App.tsx              — Top-level router (auto-generates routes from toolsConfig)
  toolsConfig.ts       — Single source of truth for all tool registrations
  lib/
    gemini.ts          — Shared AI factory: model registry, BYOK key resolution, createGeminiModel()
  hooks/
    useLocalStorage.ts — Shared localStorage hook for persistent state
  pages/
    Home.tsx           — Dashboard
    tools/
      MarkdownConverter.tsx   — Web to Obsidian Notes tool
      PromptGenerator.tsx     — Master Prompt Generator tool
      PdfPipeline.tsx         — Universal PDF Pipeline tool
      GeoJsonViewer.tsx       — GeoJSON Validator & Mapper tool
      ScribeToVault.tsx       — Scribe to Vault tool
  components/
    ui/                — shadcn/ui component library
  layouts/
    DashboardLayout.tsx — Sidebar + content shell (auto-generates nav from toolsConfig)
```

### Shared Libraries

Only infrastructure that is genuinely shared across multiple tools belongs in shared files. The rule is: **if it is only used by one tool, it lives in that tool's file.**

#### `src/lib/gemini.ts`

Responsible for three things only:

1. **Model Registry** (`GEMINI_MODELS`, `DEFAULT_GEMINI_MODEL`, `GeminiModelId`) — the authoritative list of available Gemini models. Adding a model here automatically makes it appear in the Settings modal dropdown.
2. **API Key Resolution** (`getActiveApiKey()`) — reads the BYOK key from `localStorage`, falls back to `VITE_GEMINI_API_KEY`, and throws a user-friendly error if neither is present.
3. **Model Factory** (`createGeminiModel(options?)`) — convenience function that combines the active key and the selected model into a ready-to-use `GenerativeModel` instance.

Everything else — system prompts, generation configs, temperature values — belongs in the tool file that uses them.

#### `src/hooks/useLocalStorage.ts`

A typed React hook for reading and writing to `localStorage` with automatic JSON serialisation. Used by tools that need persistent state (e.g. Web to Obsidian history). Import it in any tool that needs local persistence.

### Adding a New Tool

Follow these four steps exactly:

**Step 1 — Build the tool component**

Create `src/pages/tools/YourTool.tsx`. Keep the component fully self-contained:

```tsx
// src/pages/tools/YourTool.tsx

import { createGeminiModel } from "@/lib/gemini";

// Define all system prompts as constants at the top of this file.
// Do NOT move prompts into gemini.ts — they are tool-specific.
const MY_SYSTEM_PROMPT = `You are a ...`;

// Define all input-building functions in this file.
function buildInput(userText: string): string {
  return `Do the thing with: ${userText}`;
}

// If you need localStorage persistence, use the shared hook.
// import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function YourTool() {
  // All state, handlers, and UI logic live here.
  // Call createGeminiModel({ systemInstruction: MY_SYSTEM_PROMPT }) inside handlers.
  return <div>...</div>;
}
```

Key rules for tool files:
- All Gemini system prompts and `generationConfig` values are defined as constants in the tool file.
- Call `createGeminiModel()` inside async handlers (not at module level) so the API key is resolved at call time.
- Use `crypto.randomUUID()` for IDs — no new dependencies needed.
- Only import from `@/lib/gemini` what you actually use: typically just `createGeminiModel`.
- If your tool needs local history, use `useLocalStorage` from `@/hooks/useLocalStorage`.
- If your tool requires a new third-party API key, add a new input to `src/components/SettingsModal.tsx` and persist it to `localStorage`. Never hardcode credentials.

**Step 2 — Register the tool**

Open `src/toolsConfig.ts` and add one entry to the `toolsConfig` array. The router and sidebar are generated automatically from this array:

```ts
import YourTool from "@/pages/tools/YourTool";
import { YourIcon } from "lucide-react";

// Add to the toolsConfig array:
{
  id: "your-tool",
  label: "Your Tool Name",
  path: "/tools/your-tool",
  component: YourTool,
  icon: YourIcon,
},
```

**Step 3 — Update the dashboard**

Open `src/pages/Home.tsx` and add a description block for your tool inside the Available Tools scrollable list:

```tsx
<div className="space-y-1">
  <strong className="text-zinc-900 dark:text-zinc-100 text-sm">Your Tool Name</strong>
  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
    What it does and why it is useful.
  </p>
</div>
```

**Step 4 — Update documentation**

Add a section to this `README.md` under Features describing the new tool and its capabilities.

---

### Theme and Styling Rules

To maintain the dark/light mode experience across all tools:

- **Never** write raw CSS element rules (e.g. `button {}`) in `index.css`. This overrides Tailwind class application.
- **Never** use inline React `style={{}}` overrides.
- **Always** use Tailwind's `dark:` variant classes directly on elements (e.g. `className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"`).
- Follow the existing zinc colour palette for neutral UI and purple (`dark:bg-purple-600`) for primary actions in dark mode.

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

---

## License

MIT
