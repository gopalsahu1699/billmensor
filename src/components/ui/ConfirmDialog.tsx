'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose } from 'react-icons/md'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    description?: React.ReactNode
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'primary' | 'danger'
    loading?: boolean
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading,
}: ConfirmDialogProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const previousFocus = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!open) return
        previousFocus.current = document.activeElement as HTMLElement | null

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                e.preventDefault()
                onClose()
            }
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

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            previousFocus.current?.focus()
        }
    }, [open, onClose, loading])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={loading ? undefined : onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        aria-hidden="true"
                    />
                    <motion.div
                        ref={containerRef}
                        role="alertdialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                aria-label="Close dialog"
                                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        {description && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {description}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="h-11 px-5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={loading}
                                aria-busy={loading}
                                className={cn(
                                    'h-11 px-5 rounded-2xl text-sm font-black inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50',
                                    variant === 'danger'
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-primary text-white hover:bg-primary/90'
                                )}
                            >
                                {loading && (
                                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
