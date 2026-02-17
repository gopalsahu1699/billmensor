"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 text-slate-300 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/20"
            aria-label="Toggle theme"
        >
            <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {theme === "dark" ? (
                    <Sun size={18} strokeWidth={2} className="text-yellow-400" />
                ) : (
                    <Moon size={18} strokeWidth={2} className="text-slate-400" />
                )}
            </div>
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
    );
}
