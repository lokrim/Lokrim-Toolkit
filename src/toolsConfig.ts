import { FileText, Bot } from "lucide-react";
import MarkdownConverter from "@/pages/tools/MarkdownConverter";
import PromptGenerator from "@/pages/tools/PromptGenerator";

export interface ToolConfig {
    id: string;
    name: string;
    path: string;
    icon: React.ElementType;
    component: React.ElementType;
    description: string;
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
    }
];
