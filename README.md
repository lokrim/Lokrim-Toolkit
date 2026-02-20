# lokrim.toolkit

A sleek, lightweight web application built for personal utility and knowledge management. Designed to run locally or be deployed via Firebase Hosting.

## Features

### 📝 Web to Obsidian Notes (Text to clean Markdown)
A powerful tool designed specifically for knowledge hoarders and Obsidian users. 
- **Rich-Text Pasting**: Cmd+A / Copy an entire webpage, and simply paste it into the converter. It automatically parses the HTML, preserving all important hyperlinks (`[text](url)`) and image references (`![text](img)`).
- **AI-Powered Structuring**: Uses the `gemini-2.5-flash` model to intelligently strip noisy web boilerplate (ads, menus, footers), add strict hierarchical formatting, and turn paragraphs into readable bullet points suitable for a personal knowledge vault.
- **Local History**: Your last 3 conversions are stored securely in your browser's local storage so you can easily restore past notes.
- **Regenerate Prompt**: Easily retry the AI generation with a single click if the structure isn't perfect.

### 🔑 Bring Your Own Key (BYOK)
No backend user authentication is required to manage API credits. 
Click the **Settings** menu in the bottom-left sidebar to securely paste your own Google Gemini API Key. The key is stored safely in your browser's `localStorage` and is never sent anywhere except directly to Google's API.

## Requirements
- Node.js & npm
- A [Google AI Studio](https://aistudio.google.com/) API Key for Gemini.

## Installation & Setup

1. **Clone the repository and install dependencies:**
```bash
npm install
```

2. **Environment Variables (Optional):**
You can provide a default fallback API key in a `.env` file at the root of the project:
```env
VITE_GEMINI_API_KEY="your_api_key_here"
```
*(Note: Keys entered via the UI Settings modal take priority over the `.env` variable).*

3. **Run the development server:**
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Deployment (Firebase)

The project is fully configured as a Single Page Application (SPA) for Firebase Hosting.

1. Login to Firebase CLI:
```bash
npx firebase login
```

2. Build the production application:
```bash
npm run build
```

3. Deploy using the included `firebase.json` configuration:
```bash
npx firebase deploy
```

## Tech Stack
- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: `shadcn/ui` (Radix UI) + Lucide React icons
- **AI**: `@google/generative-ai` SDK
- **Utilities**: `turndown` for HTML-to-Markdown parsing, `react-router-dom` for navigation, `sonner` for toast notifications.

## License
MIT
