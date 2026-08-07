'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface FormSectionProps {
    title?: string
    description?: string
    icon?: React.ReactNode
    action?: React.ReactNode
    className?: string
    children: React.ReactNode
}

export function FormSection({ title, description, icon, action, className, children }: FormSectionProps) {
    return (
        <section
            className={cn(
                'bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6',
                className
            )}
            aria-labelledby={title ? 'section-title' : undefined}
        >
            {(title || action) && (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon && (
                            <span className="shrink-0 p-2.5 bg-primary/10 text-primary rounded-2xl">
                                {icon}
                            </span>
                        )}
                        <div className="min-w-0">
                            {title && (
                                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-0.5">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            {children}
        </section>
    )
}
