import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Global Theme Toggle
 * 
 * Important Developer Rule for Scalability & Consistency:
 * Do NOT use overriding CSS styles (e.g., in index.css) for components like buttons.
 * Do NOT use inline React `style={{}}` tags for dynamic theming unless absolutely necessary.
 * 
 * ONLY use Tailwind's raw `.dark` variants (e.g., `dark:bg-zinc-900`) directly on elements.
 * This guarantees that as the UI expands, the components natively subscribe to this toggle.
 */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === "dark") {
            setTheme("light");
        } else {
            setTheme("dark");
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center space-x-3 w-full px-2.5 py-2 rounded-md text-sm transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
            {theme === "dark" ? (
                <>
                    <Sun className="w-4 h-4 opacity-70" />
                    <span>Light Mode</span>
                </>
            ) : (
                <>
                    <Moon className="w-4 h-4 opacity-70" />
                    <span>Dark Mode</span>
                </>
            )}
        </button>
    );
}
