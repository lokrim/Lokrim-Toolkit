# lokrim.toolkit

A sleek, lightweight web application built for personal utility and knowledge management. Designed to run locally or be deployed via Firebase Hosting.

## Features

### 📝 Web to Obsidian Notes (Text to clean Markdown)
A powerful tool designed specifically for knowledge hoarders and Obsidian users. 
- **Rich-Text Pasting**: Cmd+A / Copy an entire webpage, and simply paste it into the converter. It automatically parses the HTML, preserving all important hyperlinks (`[text](url)`) and image references (`![text](img)`).
- **AI-Powered Structuring**: Uses the `gemini-2.5-flash` model to intelligently strip noisy web boilerplate (ads, menus, footers), add strict hierarchical formatting, and turn paragraphs into readable bullet points suitable for a personal knowledge vault.
- **Local History**: Your last 3 conversions are stored securely in your browser's local storage so you can easily restore past notes.
- **Regenerate Prompt**: Easily retry the AI generation with a single click if the structure isn't perfect.

### 🤖 Master Prompt Generator
Transform a brief, rough idea into a highly engineered, professional AI system instruction.
- **Dynamic Personas**: Select from specialized roles like Senior Full-Stack Developer, Copywriter, or UI/UX Designer to frame the AI's perspective.
- **Structured Output**: Forces the Gemini model to output a strict 4-part prompt detailing Role & Context, The Task, Constraints & Guidelines, and Expected Output Format.

### 🔑 Bring Your Own Key (BYOK)
No backend user authentication is required to manage API credits. 
Click the **Settings** menu in the bottom-left sidebar to securely paste your own Google Gemini API Key. The key is stored safely in your browser's `localStorage` and is never sent anywhere except directly to Google's API.

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

1. Build your new React component tool inside `src/pages/tools/YourTool.tsx`.
2. Open `src/toolsConfig.ts`.
3. Import your component and a Lucide icon.
4. Add a new object to the `toolsConfig` array. The app will automatically generate the route, the sidebar link, and the dashboard tile!

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
You can provide a default fallback API key in a `.env` file at the root of the project:
```env
VITE_GEMINI_API_KEY="your_api_key_here"
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
- **AI**: `@google/generative-ai` SDK
- **Utilities**: `turndown` for HTML-to-Markdown parsing, `react-router-dom` for navigation, `sonner` for toast notifications.

## License
MIT
