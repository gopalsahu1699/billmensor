'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface FormActionsProps {
    onCancel?: () => void
    onSave?: () => void
    /** set to the id of the <form> to submit it from the bar */
    formId?: string
    saving?: boolean
    disabled?: boolean
    saveLabel?: string
    cancelLabel?: string
    /** show a brief success state after save */
    success?: boolean
    /** warn before cancelling when the form has unsaved changes */
    dirty?: boolean
    sticky?: boolean
    className?: string
}

export function FormActions({
    onCancel,
    onSave,
    formId,
    saving,
    disabled,
    saveLabel = 'Save',
    cancelLabel = 'Cancel',
    success,
    dirty = false,
    sticky = true,
    className,
}: FormActionsProps) {
    const handleCancel = () => {
        if (!onCancel) return
        if (dirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return
        onCancel()
    }

    return (
        <div
            className={cn(
                'flex items-center justify-end gap-3 pt-2',
                sticky && 'sticky bottom-4 z-20',
                className
            )}
        >
            <div className="w-full md:w-auto flex items-center justify-end gap-3 p-3 md:p-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md md:bg-transparent md:dark:bg-transparent rounded-3xl border border-slate-200/70 dark:border-slate-800 md:border-0 shadow-lg md:shadow-none">
                {onCancel && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="h-12 px-5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                )}
                <button
                    type="submit"
                    form={formId}
                    onClick={formId ? undefined : onSave}
                    disabled={disabled || saving}
                    aria-busy={saving}
                    className={cn(
                        'h-12 px-7 rounded-2xl text-sm font-black uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2',
                        success
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]',
                        (disabled || saving) && 'opacity-60 cursor-not-allowed active:scale-100'
                    )}
                >
                    {saving && (
                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                    {!saving && success && (
                        <span className="flex h-4 w-4 items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    )}
                    {saving ? 'Saving…' : success ? 'Saved' : saveLabel}
                </button>
            </div>
        </div>
    )
}
