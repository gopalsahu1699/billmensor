'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldRenderProps {
    /** id to put on the input element */
    id: string
    /** id of the label element (for aria-labelledby on group controls) */
    labelId: string
    /** space-separated ids of description/error/hint (for aria-describedby) */
    describedBy?: string
    /** true when an error is present */
    invalid: boolean
    /** id of the error element */
    errorId: string
}

export interface FormFieldProps {
    label: string
    required?: boolean
    description?: string
    error?: string
    /** optional helper text shown under the input, e.g. current/max length */
    hint?: string
    className?: string
    children: (props: FormFieldRenderProps) => React.ReactNode
}

export function FormField({
    label,
    required,
    description,
    error,
    hint,
    className,
    children,
}: FormFieldProps) {
    const autoId = useId()
    const id = `field-${autoId.replace(/[:]/g, '')}`
    const labelId = `${id}-label`
    const descId = `${id}-description`
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const describedBy = [
        description ? descId : null,
        error ? errorId : null,
        hint ? hintId : null,
    ].filter(Boolean).join(' ') || undefined

    return (
        <div className={cn('space-y-1.5', className)}>
            <label
                id={labelId}
                htmlFor={id}
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
            >
                {label}
                {required && (
                    <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                )}
            </label>

            {description && (
                <p id={descId} className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    {description}
                </p>
            )}

            {children({ id, labelId, describedBy, invalid: !!error, errorId })}

            <div className="flex items-start justify-between gap-3">
                <div id={errorId} role="alert" aria-live="polite">
                    {error && (
                        <p className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span aria-hidden="true">!</span>
                            <span>{error}</span>
                        </p>
                    )}
                </div>
                {hint && (
                    <p id={hintId} className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    )
}
