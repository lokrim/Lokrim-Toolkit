# lokrim.toolkit

A sleek, lightweight web application built for personal utility and knowledge management. Designed to run locally or be deployed via Firebase Hosting.

## Features

### 📝 Web to Obsidian Notes (Text to clean Markdown)
A powerful tool designed specifically for knowledge hoarders and Obsidian users. 
- **Rich-Text Pasting**: Cmd+A / Copy an entire webpage, and simply paste it into the converter. It automatically parses the HTML, preserving all important hyperlinks (`[text](url)`) and image references (`![text](img)`).
- **AI-Powered Structuring**: Uses the `gemini-2.5-flash` model to intelligently strip noisy web boilerplate (ads, menus, footers), add strict hierarchical formatting, and turn paragraphs into readable bullet points suitable for a personal knowledge vault.
- **Local History**: Your last 3 conversions are stored securely in your browser's local storage so you can easily restore past notes.
- **Regenerate Prompt**: Easily retry the AI generation with a single click if the structure isn't perfect.

### 🧠 Master Prompt Generator
Transform rough, informal ideas into highly detailed, professional AI prompts.
- **Dynamic Configuration**: Provide a target persona (e.g. *Senior Auth Engineer*) and an optional specialized field (e.g. *Cybersecurity*) to perfectly contextualize the LLM.
- **AI-Engineered Generation**: Takes your raw bullet points/idea and expands them into a clean, strictly formatted Markdown prompt that automatically establishes role, context, task requirements, and constraints.
- **Frictionless Workflow**: One-click copy directly to your clipboard, formatted strictly as raw text to prevent nested markdown codeblock errors when pasting into other LLMs.

### 📄 Universal PDF Pipeline
Merge diverse file formats into a single, perfectly ordered PDF document.
- **Hybrid Processing**: Intelligently processes Native PDFs and Images (`.png`, `.jpg`) completely locally in your browser using `pdf-lib` for zero network overhead.
- **Office Document Support**: Securely routes Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), and Text (`.txt`) files through ConvertAPI for pristine PDF rendering before merging.
- **Drag & Drop Reordering**: Fluidly sort your pipeline array using a modern drag-and-drop interface powered by `@hello-pangea/dnd`.

### 🗺️ GeoJSON Validator & Quick Mapper
Instantly visualize, validate, and extract coordinates from GeoJSON data.
- **Live Parsing & Validation**: Paste or drag-and-drop your `.json` files. The built-in editor validates syntax on the fly and provides precise error badges if your JSON is uniquely malformed.
- **Interactive Mapping**: Automatically fits the map to your valid geometry bounds. Choose between OSM Standard, CartoDB Positron, or CartoDB Dark Matter tile layers—all strictly adhering to the global dark mode toggle.
- **Right-Click Extraction**: Right-click anywhere on the map to spawn a secure copying popup that extracts the exact `lat, long` coordinates directly to your clipboard.

### 🔑 Bring Your Own Key (BYOK) Architecture
No backend user authentication is required to manage API credits or subscriptions. 
Click the **Settings** menu in the bottom-left sidebar to securely paste your own **Google Gemini API Key** and **ConvertAPI Secret**. These keys are stored safely in your browser's `localStorage` and are never sent anywhere except directly to their respective providers.

---

## 🚀 Live Demo & Usage

**The application is live and completely free to use!** 
Try it here: [https://lokrim-toolkit.web.app](https://lokrim-toolkit.web.app)

### How to use the Web to Obsidian Converter:
1. Navigate to the live link above and click **Settings** (bottom left).
2. Paste your own free **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/)). This key is securely stored in your browser's local storage and is never saved to any outer server.
3. Click on the **Web to Obsidian** tool.
4. Go to any messy, ad-filled web article and copy exactly what you want (e.g. `Cmd+A` -> `Cmd+C`).
5. Paste it into the "Raw Article / Text" box. The tool automatically detects Rich-Text HTML and prepares the links and images. 
6. Click **Structure for Obsidian** and let AI convert it into a perfectly formatted, hierarchical Markdown note.
7. Click **Copy** and paste it directly into your Obsidian Vault!

---

## 🛠 Developer Guide: Scalability & Theming

The application is built to be easily expanded with new minimal tools while maintaining a strict consistency in design.

### Adding a New Tool
We use a scalable routing and sidebar architecture driven by a single config file (`src/toolsConfig.ts`). You do not need to manually touch `App.tsx` routing or `DashboardLayout.tsx` sidebars to add a layout.

1. **Build Component**: Create your new React component tool inside `src/pages/tools/YourTool.tsx`.
2. **Register Tool**: Open `src/toolsConfig.ts`, import your component and a Lucide icon, and add a new object to the `toolsConfig` array. The app automatically generates the route and the sidebar link!
3. **Update Dashboard**: Open `src/pages/Home.tsx` and add a new description block for your tool within the scrollable "Available Tools" grid section so users know what it does.
4. **Update Documentation**: Always update this `README.md` file to reflect the new feature in the main `Features` list.

### Architecture & Privacy Rules
- **Bring Your Own Key (BYOK)**: If your new tool requires external APIs, do NOT hardcode API keys or require a backend user-authentication system. Instead, add a new input to the `SettingsModal.tsx` and securely persist the user's private key into their browser's `localStorage` (just like the existing Gemini and ConvertAPI implementations). This guarantees the user's API quota remains private and the application can remain a statically hosted SPA.

### Theme Rules for Consistency
To maintain the premium dark/light mode experience:
- **Rule 1**: NEVER write raw CSS rules for elements (e.g. `button {}`) in `index.css`. This breaks Tailwind's class application.
- **Rule 2**: NEVER use inline react `<div style={{ backgroundColor: 'white' }}>` overrides. 
- **Rule 3**: ALWAYS rely purely on Tailwind's `dark:` variant classes directly on your elements (e.g. `className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"`). This guarantees your new tool will natively support the global theme toggle.

---

## Developer Installation & Setup

Want to run it locally or contribute?

1. **Clone the repository and install dependencies:**
```bash
npm install
```

2. **Environment Variables (Optional):**
You can provide default fallback API keys in a `.env` file at the root of the project:
```env
VITE_GEMINI_API_KEY="your_gemini_key_here"
VITE_CONVERT_API_KEY="your_convertapi_secret_here"
```

3. **Run the development server:**
```bash
npm run dev
```

## Deployment (Firebase CI/CD)

The project is fully configured as a Single Page Application (SPA) for Firebase Hosting with GitHub Actions.

- Any push to the `main` branch automatically triggers the `.github/workflows/firebase-hosting-merge.yml` action.
- This action installs dependencies, builds the Vite production bundle, and securely deploys the updated `dist` folder to Firebase Hosting.

## Tech Stack
- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: `shadcn/ui` (Radix UI) + Lucide React icons
- **AI / Conversion**: `@google/generative-ai` SDK, `pdf-lib`
- **Utilities**: `turndown` for HTML parsing, `react-router-dom` for navigation, `sonner` for local toasts, `@hello-pangea/dnd` & `react-dropzone` for array management.

## License
MIT
