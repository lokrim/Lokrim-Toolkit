
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { toolsConfig } from "@/toolsConfig";
import { Wrench } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import SettingsModal from "@/components/SettingsModal";

export default function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="flex h-screen w-full bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col hidden md:flex">
                {/* Logo area */}
                <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 font-semibold text-sm tracking-tight space-x-2">
                    <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-1.5 rounded-md">
                        <Wrench className="w-4 h-4" />
                    </div>
                    <span>lokrim.toolkit</span>
                </div>

                {/* Navigation links */}
                <div className="flex-1 overflow-auto py-4 px-3 space-y-1">
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 px-2 uppercase tracking-wider">
                        Tools
                    </div>
                    {toolsConfig.map((tool) => {
                        const isActive = location.pathname.startsWith(tool.path);
                        const Icon = tool.icon;
                        return (
                            <NavLink
                                key={tool.id}
                                to={tool.path}
                                className={`flex items-center space-x-3 px-2.5 py-2 rounded-md text-sm transition-colors ${isActive
                                    ? "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 font-medium"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "" : "opacity-70"}`} />
                                <span>{tool.name}</span>
                            </NavLink>
                        );
                    })}
                </div>

                {/* Footer info & Settings */}
                <div className="flex flex-col space-y-3 p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    <SettingsModal />
                    <div>Personal utilities &copy; {new Date().getFullYear()}</div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
                <div className="h-full overflow-auto">
                    <Outlet />
                </div>
            </main>

            <Toaster />
        </div>
    );
}
