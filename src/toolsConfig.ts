import { FileText } from "lucide-react";
import MarkdownConverter from "@/pages/tools/MarkdownConverter";

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
];
