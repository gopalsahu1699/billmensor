'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdSearch, MdClose, MdCheck } from 'react-icons/md'
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
    emptyMessage?: string
    createLabel?: string
    onCreateNew?: () => void
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
    valueKey,
    emptyMessage = "No results found",
    createLabel,
    onCreateNew
}: SelectorModalProps<T>) {
    const [search, setSearch] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return items
        return items.filter(item => {
            return searchKeys.some(key => {
                const val = item[key]
                return val && String(val).toLowerCase().includes(query)
            })
        })
    }, [search, items, searchKeys])

    // Focus the search input when the modal opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => inputRef.current?.focus(), 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Close on Escape and trap focus
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Tab') {
                const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                if (!focusable || focusable.length === 0) return
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }

        const previousFocus = document.activeElement as HTMLElement | null
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            previousFocus?.focus()
        }
    }, [isOpen, onClose])

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
                        ref={containerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 italic uppercase italic tracking-tight">{title}</h3>
                            <button
                                onClick={onClose}
                                aria-label="Close dialog"
                                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="relative mb-4">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    ref={inputRef}
                                    placeholder={placeholder}
                                    aria-label={placeholder}
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
                                                        <MdCheck size={14} />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="py-10 text-center space-y-4">
                                        <p className="text-slate-400 dark:text-slate-500 font-medium">
                                            {search.trim() ? `No results found for "${search}"` : emptyMessage}
                                        </p>
                                        {onCreateNew && createLabel && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onCreateNew()
                                                    onClose()
                                                }}
                                                className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-colors"
                                            >
                                                <span aria-hidden="true">+</span>
                                                {createLabel}
                                            </button>
                                        )}
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
