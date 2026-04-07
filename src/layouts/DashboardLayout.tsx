import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { toolsConfig } from "@/toolsConfig";
import { Wrench, Home as HomeIcon, Menu } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import SettingsModal from "@/components/SettingsModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * Main Application Shell
 * 
 * Provides the core layout structure: a responsive left sidebar for navigation
 * and a main content area for the currently active tool instance.
 * 
 * Scalability Note: The sidebar navigation links are NOT hardcoded. They are
 * dynamically mapped from `src/toolsConfig.ts`. Adding a new tool there will
 * automatically populate a new navigation link here.
 */
export default function DashboardLayout() {
    const location = useLocation();
    
    // Configurable Layout States
    const [sidebarWidth, setSidebarWidth] = useLocalStorage("lokrim_sidebar_width", 256);
    const [isCollapsed, setIsCollapsed] = useLocalStorage("lokrim_sidebar_collapsed", false);
    const [isDragging, setIsDragging] = useState(false);
    
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 500;
    const COLLAPSED_WIDTH = 64;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            // Prevent text selection during drag
            document.body.style.userSelect = "none";
            document.body.style.cursor = "col-resize";
            
            let newWidth = e.clientX;
            if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
            if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, setSidebarWidth]);

    const activeWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

    return (
        <div className="flex h-screen w-full bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50 overflow-hidden relative">
            
            {/* ── Sidebar ── */}
            <aside 
                style={{ width: `${activeWidth}px` }}
                className={`relative flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col transition-[width] duration-300 ease-in-out ${isDragging ? '!transition-none' : ''}`}
            >
                <div className="flex flex-col h-full w-full opacity-100 transition-opacity duration-200 overflow-hidden">
                    {/* Logo area */}
                    <div 
                        className={`h-14 border-b border-zinc-200 dark:border-zinc-800 flex flex-shrink-0 items-center font-semibold text-sm tracking-tight cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors ${isCollapsed ? 'justify-center p-0' : 'px-4 space-x-2'}`}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title="Toggle Sidebar"
                    >
                        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-1.5 rounded-md shrink-0">
                            <Wrench className="w-4 h-4" />
                        </div>
                        {!isCollapsed && <span className="truncate">lokrim.toolkit</span>}
                    </div>

                    {/* Navigation links */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 custom-scrollbar">
                        {!isCollapsed && (
                            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 px-2 uppercase tracking-wider">
                                Overview
                            </div>
                        )}

                        <NavLink
                            to="/"
                            end
                            title={isCollapsed ? "Dashboard" : undefined}
                            className={({ isActive }) => `flex items-center rounded-md text-sm transition-colors ${isCollapsed ? 'justify-center p-2' : 'space-x-3 px-2.5 py-2'} ${isActive
                                ? "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 font-medium"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <HomeIcon className={`w-4 h-4 shrink-0 ${isActive ? "" : "opacity-70"}`} />
                                    {!isCollapsed && <span className="truncate">Dashboard</span>}
                                </>
                            )}
                        </NavLink>

                        {!isCollapsed ? (
                            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-6 mb-2 px-2 uppercase tracking-wider">
                                Tools
                            </div>
                        ) : (
                            <div className="h-6 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-2 mx-1" />
                        )}
                        
                        {toolsConfig.map((tool) => {
                            const isActive = location.pathname.startsWith(tool.path);
                            const Icon = tool.icon;
                            return (
                                <NavLink
                                    key={tool.id}
                                    to={tool.path}
                                    title={tool.name}
                                    className={`flex items-center rounded-md text-sm transition-colors ${isCollapsed ? 'justify-center p-2' : 'space-x-3 px-2.5 py-2'} ${isActive
                                        ? "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 font-medium"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "" : "opacity-70"}`} />
                                    {!isCollapsed && <span className="truncate">{tool.name}</span>}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Footer info & Settings */}
                    <div className={`flex flex-col flex-shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 ${isCollapsed ? 'items-center space-y-3' : 'space-y-1'}`}>
                        <ThemeToggle isCollapsed={isCollapsed} />
                        <SettingsModal isCollapsed={isCollapsed} />
                        {!isCollapsed && <div className="px-2.5 pt-3 pb-1 truncate text-[11px]">Personal utilities &copy; {new Date().getFullYear()}</div>}
                    </div>
                </div>

                {/* ── Resizer ── */}
                {!isCollapsed && (
                    <div 
                        className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize z-50 group hover:bg-purple-500/50 dark:hover:bg-purple-400/50 transition-colors ${isDragging ? 'bg-purple-500 dark:bg-purple-400' : 'bg-transparent'}`}
                        onMouseDown={() => setIsDragging(true)}
                    />
                )}
            </aside>

            {/* Mobile Menu override button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-3 left-4 z-40 p-2 md:hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm"
            >
                <Menu className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </button>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-zinc-950 relative">
                <div className="flex-1 h-full w-full min-w-0 overflow-auto">
                    <Outlet />
                </div>
            </main>

            <Toaster />
        </div>
    );
}
