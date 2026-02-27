import { GoogleGenerativeAI } from "@google/generative-ai";

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

/**
 * Retrieves the active Gemini API key.
 * 
 * Scalability/Auth Strategy:
 * Prioritizes a user-provided, locally stored key ("Bring Your Own Key") to 
 * ensure the deployed app does not exhaust a single host API quota. 
 * Falls back to the environment variable for local development if no local key exists.
 */
function getActiveApiKey(): string {
    let customKey = "";
    try {
        const stored = window.localStorage.getItem("lokrim_gemini_key");
        if (stored) {
            customKey = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to parse stored API key", e);
    }
    const activeKey = customKey || ENV_API_KEY;
    if (!activeKey) {
        throw new Error("Gemini API key is not configured. Please add it in Settings or via VITE_GEMINI_API_KEY.");
    }
    return activeKey;
}

export async function convertTextToMarkdown(text: string): Promise<string> {
    const activeKey = getActiveApiKey();

    if (!text.trim()) {
        throw new Error("Input text is empty. Please provide some text to convert.");
    }

    try {
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Detailed prompt to guide the AI's formatting behavior
        const prompt = `You are an expert technical editor and knowledge management assistant. Your task is to process raw, unstructured text (often a "Select All + Copy" dump from a web page) and convert it into clean, highly structured Markdown optimized for Obsidian study notes.

Adhere strictly to the following rules:
1. Extract Core Content: Identify and retain only the primary article, tutorial, or documentation. Ruthlessly remove all web boilerplate, navigation menus, sidebar text, cookie notices, advertisements, and footers.
2. Preserve Media & Links: You MUST retain all valid hyperlinks \`[text](url)\` and image references \`![alt text](image_url)\`. Ensure image links remain intact and correctly formatted.
3. Structural Formatting: 
   - Use strict hierarchical headings (H1 for the main title, H2 for main sections, H3 for sub-sections).
   - Convert dense, messy paragraphs into readable bulleted or numbered lists where logical.
   - Use bold text for key terms and standard Markdown blockquotes (\`>\`) for important notes or warnings.
4. Code Blocks: Format all code snippets with standard triple backticks and the appropriate language identifier (e.g., \`javascript\`, \`python\`, \`bash\`).

CRITICAL: DO NOT wrap your entire output in a \`\`\`markdown ... \`\`\` code block. The output must be the raw markdown text itself, starting immediately with the content (e.g. the YAML block or heading). Do not include any starting/ending markdown notation around the whole thing. Do not include conversational filler.

Raw text:
${text}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(error.message || "Failed to convert text to Markdown.");
    }
}

export async function generateExpertPrompt(persona: string, specializedField: string, roughIdea: string): Promise<string> {
    const activeKey = getActiveApiKey();

    if (!roughIdea.trim()) {
        throw new Error("Rough idea is empty. Please provide a rough idea to generate a prompt.");
    }

    try {
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const fieldContext = specializedField.trim() ? ` along with knowledge in ${specializedField}` : "";

        const prompt = `You are an Expert Prompt Engineer. Your objective is to take the user's rough, informal idea (often given as raw bullet points) and transform it into a highly detailed, extremely professional engineered prompt that will yield the best possible result from an LLM.

The prompt you are generating MUST strictly start with exactly this structure:
"You are an Expert ${persona}${fieldContext}..."

Followed seamlessly by the structured instructions engineered from the user's rough idea.

Using the rough idea provided, construct the rest of the master prompt following this logic:
1. Context & Task: Define exactly the overarching goal and provide necessary background context based on their notes.
2. Constraints & Rules: Detail explicit rules the AI must follow derived from their idea (e.g., specific framework paradigms to adhere to, boundaries to respect).
3. The Requirements: List out the concrete steps or specific deliverables needed from the LLM.

CRITICAL: DO NOT wrap your entire output in a \`\`\`markdown ... \`\`\` code block. Do not use ANY outer code blocks. Your output must be purely the raw engineered prompt text itself. Do not provide conversational filler. 

Format your engineered prompt cleanly using Markdown so it can be easily copied and pasted to another LLM interface.

User's Rough Idea: 
${roughIdea}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(error.message || "Failed to generate prompt.");
    }
}
