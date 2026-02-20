'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, Check } from 'lucide-react'
import { Input } from './input'

interface SelectorModalProps<T> {
    isOpen: boolean
    onClose: () => void
    title: string
    items: T[]
    searchKeys: (keyof T)[]
    onSelect: (item: T) => void
    renderItem: (item: T) => React.ReactNode
    placeholder?: string
    selectedValue?: string | number
    valueKey: keyof T
}

export function SelectorModal<T>({
    isOpen,
    onClose,
    title,
    items,
    searchKeys,
    onSelect,
    renderItem,
    placeholder = "Search...",
    selectedValue,
    valueKey
}: SelectorModalProps<T>) {
    const [search, setSearch] = useState('')
    const [filteredItems, setFilteredItems] = useState<T[]>(items)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setSearch('')
            setFilteredItems(items)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen, items])

    useEffect(() => {
        const query = search.toLowerCase()
        if (!query) {
            setFilteredItems(items)
            return
        }

        const filtered = items.filter(item => {
            return searchKeys.some(key => {
                const val = item[key]
                return val && String(val).toLowerCase().includes(query)
            })
        })
        setFilteredItems(filtered)
    }, [search, items, searchKeys])

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase italic tracking-tight">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    ref={inputRef}
                                    placeholder={placeholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none ring-offset-transparent focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all font-medium"
                                />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-1 p-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item, idx) => {
                                        const isSelected = selectedValue === String(item[valueKey])
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    onSelect(item)
                                                    onClose()
                                                }}
                                                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500/20'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-2 border-transparent'
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    {renderItem(item)}
                                                </div>
                                                {isSelected && (
                                                    <div className="bg-blue-500 text-white p-1 rounded-full">
                                                        <Check size={14} />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="py-12 text-center text-slate-400 font-medium">
                                        No results found for &quot;{search}&quot;
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
