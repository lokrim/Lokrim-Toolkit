import { FileText, Bot, FileJson2, Map, NotebookPen, ChefHat } from "lucide-react";
import MarkdownConverter from "@/pages/tools/MarkdownConverter";
import PromptGenerator from "@/pages/tools/PromptGenerator";
import PdfPipeline from "@/pages/tools/PdfPipeline";
import GeoJsonViewer from "@/pages/tools/GeoJsonViewer";
import ScribeToVault from "@/pages/tools/ScribeToVault";
import FlavourForge from "@/pages/tools/FlavourForge";

/**
 * @file toolsConfig.ts
 * @description Single source of truth for all tool registrations in lokrim-toolkit.
 *
 * The router, sidebar, and dashboard are all generated dynamically from the
 * `toolsConfig` array below. Adding a new tool requires no changes to
 * `App.tsx` or `DashboardLayout.tsx`.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HOW TO ADD A NEW TOOL (5 steps)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Step 1 — Create prompt constants  (if the tool uses AI)
 *   Create `src/lib/prompts/yourTool.ts` and export your system prompts and
 *   any input-builder functions. See `promptGenerator.ts` for a template.
 *   Keep prompts here so they can be reviewed and versioned independently.
 *
 * Step 2 — Create an AI hook  (if the tool uses AI)
 *   Create `src/hooks/useYourTool.ts`. Import prompts from Step 1 and
 *   `createGeminiModel` from `@/lib/models`. Put all AI calls, useState,
 *   and localStorage logic here. See `usePromptGenerator.ts` for a template.
 *   The hook exposes a clean API: `{ state, generate, refine, ... }`.
 *
 * Step 3 — Build the tool component
 *   Create `src/pages/tools/YourTool.tsx`. Import and call your hook from
 *   Step 2. The component should only render state and dispatch actions —
 *   no AI calls, no raw localStorage access, no system prompts.
 *
 *   If the tool does not use AI (e.g. GeoJSON Viewer, PDF Pipeline),
 *   skip Steps 1–2, and keep all logic in the component directly.
 *
 * Step 4 — Register the tool here
 *   Import your component and a lucide-react icon, then add a new object
 *   to the `toolsConfig` array below. The router and sidebar update automatically.
 *
 *   Example entry:
 *   {
 *     id: "your-tool",
 *     name: "Your Tool Name",
 *     path: "/tools/your-tool",
 *     icon: YourIcon,
 *     component: YourTool,
 *     description: "One-sentence description shown on the dashboard.",
 *     requiresGemini: true,    // optional: shows an AI badge
 *     tags: ["ai", "text"],    // optional: for future filtering
 *     status: "beta",          // optional: "stable" | "beta" | "experimental"
 *   }
 *
 * Step 5 — Update the README
 *   Add a section under `## Features` in `README.md` describing the new tool.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration object for a single tool in the toolkit.
 *
 * Required fields define the route, navigation, and rendering.
 * Optional fields are used by the dashboard for badges and future filtering —
 * existing tools do not need to add them unless relevant.
 */
export interface ToolConfig {
    /** Unique identifier in kebab-case. Used as the React Router key. */
    id: string;
    /** Display name shown in the sidebar navigation and dashboard cards. */
    name: string;
    /** URL route path (e.g. "/tools/my-tool"). Must start with "/tools/". */
    path: string;
    /** Lucide-react icon component rendered in the sidebar. */
    icon: React.ElementType;
    /** The React page component to render at the tool's route. */
    component: React.ElementType;
    /** One-sentence description shown on the Home dashboard card. */
    description: string;

    // ── Optional metadata ──────────────────────────────────────────────────
    /** Topic tags for future dashboard filtering (e.g. ["ai", "pdf", "notes"]). */
    tags?: string[];
    /**
     * Set to `true` if the tool makes Gemini API calls.
     * The dashboard can use this to show an "AI-powered" badge and prompt
     * users to configure their API key before using the tool.
     */
    requiresGemini?: boolean;
    /**
     * Set to `true` if the tool requires a ConvertAPI key.
     * SettingsModal can use this to surface a relevant hint.
     */
    requiresConvertApi?: boolean;
    /**
     * Release maturity of the tool.
     *  - "stable"       — production-ready, fully tested
     *  - "beta"         — functional but may have rough edges
     *  - "experimental" — proof of concept, may change significantly
     * Omit entirely for stable tools to keep the dashboard clean.
     */
    status?: "stable" | "beta" | "experimental";
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const toolsConfig: ToolConfig[] = [
    {
        id: "web-to-obsidian",
        name: "Web to Obsidian",
        path: "/tools/web-to-obsidian",
        icon: FileText,
        component: MarkdownConverter,
        description: "Paste web articles to extract and convert them into clean, structured Obsidian notes.",
        tags: ["ai", "notes", "markdown"],
        requiresGemini: true,
    },
    {
        id: "prompt-generator",
        name: "Prompt Generator",
        path: "/tools/prompt-generator",
        icon: Bot,
        component: PromptGenerator,
        description: "Transform rough ideas into highly optimized, professional prompts for AI models.",
        tags: ["ai", "prompts"],
        requiresGemini: true,
    },
    {
        id: "pdf-pipeline",
        name: "Universal PDF Pipeline",
        path: "/tools/pdf-pipeline",
        icon: FileJson2,
        component: PdfPipeline,
        description: "Drag and drop images, PDFs, and Office docs to merge, order, and convert them into a single PDF.",
        tags: ["pdf", "files"],
        requiresConvertApi: true,
    },
    {
        id: "geojson-viewer",
        name: "GeoJSON Quick Mapper",
        path: "/tools/geojson-viewer",
        icon: Map,
        component: GeoJsonViewer,
        description: "Paste GeoJSON data to instantly view and validate it on an interactive map. Right click to copy coordinates.",
        tags: ["geo", "maps"],
    },
    {
        id: "scribe-to-vault",
        name: "Scribe to Vault",
        path: "/tools/scribe-to-vault",
        icon: NotebookPen,
        component: ScribeToVault,
        description: "Upload a scanned PDF of handwritten notes. AI splits them into topic-wise Markdown files for your Obsidian vault.",
        tags: ["ai", "notes", "pdf"],
        requiresGemini: true,
    },
    {
        id: "flavour-forge",
        name: "Flavour Forge",
        path: "/tools/flavour-forge",
        icon: ChefHat,
        component: FlavourForge,
        description: "A multi-pass AI recipe generator that adapts to your kitchen constraints. Uses Gemini for culinary rationale and Pollinations AI for dish visualization.",
        tags: ["ai", "food", "recipe"],
        requiresGemini: true,
    },
];
