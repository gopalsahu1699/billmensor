'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MdKeyboardArrowDown } from 'react-icons/md'

const BASE_INPUT =
    'flex w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50'

const INVALID_INPUT =
    'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-500/5 focus:ring-red-400/30 text-red-900 dark:text-red-200'

export type InputTransform = 'none' | 'upper' | 'lower' | 'words'

export interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean
    icon?: React.ReactNode
    transform?: InputTransform
    trimOnBlur?: boolean
    onValueChange?: (value: string) => void
}

export function SmartInput({
    className,
    invalid,
    icon,
    transform = 'none',
    trimOnBlur = false,
    onValueChange,
    onChange,
    onBlur,
    maxLength,
    ...props
}: SmartInputProps) {
    const applyTransform = (raw: string): string => {
        if (transform === 'upper') return raw.toUpperCase()
        if (transform === 'lower') return raw.toLowerCase()
        return raw
    }

    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    {icon}
                </span>
            )}
            <input
                className={cn(
                    BASE_INPUT,
                    'h-12',
                    icon && 'pl-11',
                    maxLength && 'pr-14',
                    invalid && INVALID_INPUT,
                    className
                )}
                maxLength={maxLength}
                onChange={(e) => {
                    const next = applyTransform(e.target.value)
                    onValueChange?.(next)
                    onChange?.(e)
                }}
                onBlur={(e) => {
                    let next = e.target.value
                    if (trimOnBlur || transform === 'words') {
                        next = trimOnBlur ? next.trim() : next
                    }
                    if (transform === 'words') {
                        next = next.replace(/\s+/g, ' ').split(' ').map((w) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w).join(' ')
                    }
                    if (next !== e.target.value) {
                        e.target.value = next
                        onValueChange?.(next)
                        onChange?.({ ...e, target: e.target } as React.ChangeEvent<HTMLInputElement>)
                    }
                    onBlur?.(e)
                }}
                {...props}
            />
            {maxLength && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none tabular-nums">
                    {String(props.value ?? '').length}/{maxLength}
                </span>
            )}
        </div>
    )
}

export interface SmartNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: string | number | undefined | null
    onValueChange: (value: number | undefined) => void
    invalid?: boolean
    prefix?: string
    suffix?: string
    min?: number
    max?: number
    decimals?: number
    allowNegative?: boolean
    showSteppers?: boolean
    step?: number
    icon?: React.ReactNode
}

export function SmartNumberInput({
    value,
    onValueChange,
    invalid,
    prefix,
    suffix,
    min = 0,
    max,
    decimals = 2,
    allowNegative = false,
    showSteppers = false,
    step = 1,
    icon,
    className,
    onBlur,
    id,
    ...props
}: SmartNumberInputProps) {
    const [display, setDisplay] = useState('')
    const [trackedValue, setTrackedValue] = useState(value)
    const [focused, setFocused] = useState(false)

    const formatValue = (val: string | number | undefined | null): string => {
        if (val === undefined || val === null || val === '') return ''
        const num = Number(val)
        return isNaN(num) ? String(val) : num.toLocaleString('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
    }

    if (trackedValue !== value) {
        setTrackedValue(value)
        if (!focused) {
            setDisplay(formatValue(value))
        }
    }

    const parse = (raw: string): number | undefined => {
        if (raw === '' || raw === '-' || raw === '.') return undefined
        const clean = raw.replace(/,/g, '')
        const num = Number(clean)
        return isNaN(num) ? undefined : num
    }

    const clamp = (num: number): number => {
        let next = num
        if (min !== undefined && next < min) next = min
        if (max !== undefined && next > max) next = max
        if (!allowNegative && next < 0) next = 0
        return next
    }

    const handleChange = (raw: string) => {
        setFocused(true)
        let next = raw.replace(/[^\d.]/g, '')
        if (allowNegative && raw.startsWith('-')) next = '-' + next
        if ((next.match(/\./g) || []).length > 1) {
            const [head, ...rest] = next.split('.')
            next = head + '.' + rest.join('')
        }
        if (decimals === 0) next = next.replace(/\./g, '')
        if (next.startsWith('-') && next.length > 1 && next[1] === '-') next = next.slice(1)
        setDisplay(next)
        onValueChange(parse(next))
    }

    const stepBy = (dir: 1 | -1) => {
        const current = parse(display) ?? 0
        const next = clamp(Number((current + dir * step).toFixed(decimals)))
        setDisplay(next.toLocaleString('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }))
        onValueChange(next)
    }

    return (
        <div className="relative w-full">
            {icon && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    {icon}
                </span>
            )}
            {prefix && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-sm font-bold">
                    {prefix}
                </span>
            )}
            <input
                id={id}
                inputMode="decimal"
                autoComplete="off"
                className={cn(
                    BASE_INPUT,
                    'h-12',
                    (prefix || icon) && 'pl-11',
                    suffix && 'pr-12',
                    showSteppers && 'pr-20',
                    invalid && INVALID_INPUT,
                    'tabular-nums',
                    className
                )}
                value={display}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => { setFocused(true) }}
                onBlur={(e) => {
                    setFocused(false)
                    if (display === '' || display === '-' || display === '.') {
                        setDisplay('')
                        onValueChange(undefined)
                    } else {
                        const num = parse(display)
                        if (num === undefined) {
                            setDisplay('')
                            onValueChange(undefined)
                        } else {
                            const clamped = clamp(num)
                            setDisplay(clamped.toLocaleString('en-IN', {
                                minimumFractionDigits: decimals,
                                maximumFractionDigits: decimals,
                            }))
                            onValueChange(clamped)
                        }
                    }
                    onBlur?.(e)
                }}
                {...props}
            />
            {suffix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-sm font-bold">
                    {suffix}
                </span>
            )}
            {showSteppers && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Increase value"
                        onClick={() => stepBy(1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-sm font-black transition-colors"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Decrease value"
                        onClick={() => stepBy(-1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-sm font-black transition-colors"
                    >
                        −
                    </button>
                </div>
            )}
        </div>
    )
}

export interface SmartSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    invalid?: boolean
    placeholderOption?: string
}

export function SmartSelect({
    className,
    invalid,
    placeholderOption,
    children,
    ...props
}: SmartSelectProps) {
    return (
        <div className="relative w-full">
            <select
                className={cn(
                    BASE_INPUT,
                    'h-12 appearance-none pr-10 cursor-pointer',
                    props.value === '' && 'text-slate-400 dark:text-slate-500',
                    invalid && INVALID_INPUT,
                    className
                )}
                {...props}
            >
                {placeholderOption !== undefined && (
                    <option value="" disabled>{placeholderOption}</option>
                )}
                {children}
            </select>
            <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
        </div>
    )
}

export interface SmartTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    invalid?: boolean
    autoResize?: boolean
    onValueChange?: (value: string) => void
}

export function SmartTextarea({
    className,
    invalid,
    autoResize = true,
    onValueChange,
    maxLength,
    ...props
}: SmartTextareaProps) {
    const ref = useRef<HTMLTextAreaElement>(null)

    const resize = () => {
        const el = ref.current
        if (!el || !autoResize) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 220) + 'px'
    }

    return (
        <div className="relative w-full">
            <textarea
                ref={ref}
                className={cn(
                    BASE_INPUT,
                    'min-h-[96px] py-3 resize-none leading-relaxed',
                    invalid && INVALID_INPUT,
                    className
                )}
                maxLength={maxLength}
                onChange={(e) => {
                    onValueChange?.(e.target.value)
                    resize()
                    props.onChange?.(e)
                }}
                {...props}
            />
            {maxLength && (
                <span className="absolute right-3 bottom-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none tabular-nums">
                    {String(props.value ?? '').length}/{maxLength}
                </span>
            )}
        </div>
    )
}

export function EmailInput(props: Omit<SmartInputProps, 'transform' | 'type' | 'inputMode' | 'autoComplete'>) {
    return (
        <SmartInput
            type="email"
            inputMode="email"
            autoComplete="email"
            transform="lower"
            {...props}
        />
    )
}

export function PhoneInput(props: Omit<SmartInputProps, 'inputMode' | 'type' | 'autoComplete'>) {
    return (
        <SmartInput
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...props}
        />
    )
}

export function GSTInput(props: Omit<SmartInputProps, 'transform' | 'autoComplete'>) {
    return (
        <SmartInput
            transform="upper"
            autoComplete="off"
            spellCheck={false}
            {...props}
        />
    )
}
