'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ variant = 'default' }: { variant?: 'default' | 'icon' }) {
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        setDarkMode(isDark)
        if (isDark) {
            document.documentElement.classList.add('dark')
        }
    }, [])

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        if (newMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={toggleDarkMode}
                className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95 group"
                aria-label="Toggle theme"
            >
                {darkMode ?
                    <Sun size={22} strokeWidth={2} className="group-hover:text-yellow-500 transition-colors" /> :
                    <Moon size={22} strokeWidth={2} className="group-hover:text-blue-500 transition-colors" />
                }
            </button>
        )
    }

    return (
        <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent hover:border-white/20 text-slate-300 hover:bg-white/5 hover:text-white"
        >
            <div className="flex items-center gap-3">
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${darkMode ? 'bg-blue-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ${darkMode ? 'left-6' : 'left-1'}`} />
            </div>
        </button>
    )
}
