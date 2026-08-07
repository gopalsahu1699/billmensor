'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { MdInfoOutline, MdWarningAmber, MdCheckCircleOutline, MdErrorOutline } from 'react-icons/md'

export interface InlineAlertProps {
    variant?: 'info' | 'success' | 'warning' | 'error'
    title?: string
    children?: React.ReactNode
    className?: string
}

const STYLES: Record<NonNullable<InlineAlertProps['variant']>, string> = {
    info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    error: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/20',
}

const ICONS = {
    info: <MdInfoOutline size={18} aria-hidden="true" />,
    success: <MdCheckCircleOutline size={18} aria-hidden="true" />,
    warning: <MdWarningAmber size={18} aria-hidden="true" />,
    error: <MdErrorOutline size={18} aria-hidden="true" />,
}

export function InlineAlert({ variant = 'info', title, children, className }: InlineAlertProps) {
    return (
        <div
            role={variant === 'error' ? 'alert' : 'status'}
            className={cn(
                'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
                STYLES[variant],
                className
            )}
        >
            <span className="shrink-0 mt-0.5">{ICONS[variant]}</span>
            <div className="min-w-0 space-y-0.5">
                {title && <p className="font-bold">{title}</p>}
                {children && <div className="leading-relaxed">{children}</div>}
            </div>
        </div>
    )
}
