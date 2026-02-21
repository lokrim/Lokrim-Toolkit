import { FileText, Bot, FileJson2 } from "lucide-react";
import MarkdownConverter from "@/pages/tools/MarkdownConverter";
import PromptGenerator from "@/pages/tools/PromptGenerator";
import PdfPipeline from "@/pages/tools/PdfPipeline";

/**
 * Core Configuration for lokrim.toolkit
 * 
 * To add a new tool to the application:
 * 1. Create your new React component in `src/pages/tools/YourTool.tsx`
 * 2. Import the component and a lucide-react icon here.
 * 3. Add a new configuration object to the `toolsConfig` array below.
 * 
 * The system will automatically:
 * - Generate the React Router entry in `App.tsx`
 * - Add the navigation link into the sidebar in `DashboardLayout.tsx`
 * - Render the tool card on the `Home.tsx` dashboard.
 */
export interface ToolConfig {
    id: string;             // Unique identifier (kebab-case)
    name: string;           // Display name shown in sidebar and dashboard
    path: string;           // URL route (e.g., /tools/my-new-tool)
    icon: React.ElementType;// Lucide-react icon component
    component: React.ElementType; // The React component to render
    description: string;    // Brief explanation shown on the Home dashboard
}

export const toolsConfig: ToolConfig[] = [
    {
        id: "web-to-obsidian",
        name: "Web to Obsidian",
        path: "/tools/web-to-obsidian",
        icon: FileText,
        component: MarkdownConverter,
        description: "Paste web articles to extract and convert them into clean, structured Obsidian notes.",
    },
    {
        id: "prompt-generator",
        name: "Prompt Generator",
        path: "/tools/prompt-generator",
        icon: Bot,
        component: PromptGenerator,
        description: "Transform rough ideas into highly optimized, professional prompts for AI models.",
    },
    {
        id: "pdf-pipeline",
        name: "Universal PDF Pipeline",
        path: "/tools/pdf-pipeline",
        icon: FileJson2,
        component: PdfPipeline,
        description: "Drag and drop images, PDFs, and Office docs to merge, order, and convert them into a single PDF.",
    }
];
