import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

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
