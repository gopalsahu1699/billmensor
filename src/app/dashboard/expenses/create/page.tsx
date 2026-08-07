'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FormField } from '@/components/ui/form/FormField'
import { FormSection } from '@/components/ui/form/FormSection'
import { FormActions } from '@/components/ui/form/FormActions'
import { SmartInput, SmartSelect, SmartNumberInput, SmartTextarea } from '@/components/ui/form/smart-inputs'
import { validateRequired, validatePositiveNumber } from '@/lib/field-validation'
import { friendlyError } from '@/lib/friendly-errors'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

interface ExpenseForm {
    title: string
    category: string
    amount: string
    expense_date: string
    description: string
}

const DEFAULT_FORM: ExpenseForm = {
    title: '',
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
}

const EXPENSE_CATEGORIES = [
    'General',
    'Rent',
    'Salary',
    'Utilities',
    'Travel',
    'Marketing',
    'Taxes',
    'Office Supplies',
    'Maintenance',
]

function fieldError(key: keyof ExpenseForm, f: ExpenseForm): string | undefined {
    if (key === 'title') {
        return f.title.trim() ? undefined : 'Please enter the expense title.'
    }
    if (key === 'amount') {
        return validateRequired(f.amount, 'amount') ?? validatePositiveNumber(f.amount, 'Amount') ?? undefined
    }
    return undefined
}

export default function CreateExpensePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [form, setForm] = useState<ExpenseForm>(DEFAULT_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof ExpenseForm, string>>>({})
    const [dirty, setDirty] = useState(false)
    const { confirmLeave } = useUnsavedChanges(dirty)

    const update = (key: keyof ExpenseForm, value: string) => {
        setForm((f) => ({ ...f, [key]: value }))
        setDirty(true)
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e))
    }

    const updateAmount = (value: number | undefined) => {
        setForm((f) => ({ ...f, amount: value === undefined ? '' : String(value) }))
        setDirty(true)
        setErrors((e) => (e.amount ? { ...e, amount: '' } : e))
    }

    const blurValidate = (key: keyof ExpenseForm) => {
        const msg = fieldError(key, form)
        setErrors((e) => ({ ...e, [key]: msg ?? '' }))
    }

    const fetchExpense = useCallback(async () => {
        if (!editId) return
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', editId)
                .single()

            if (error) throw error
            setForm({
                title: data.title || '',
                category: data.category || '',
                amount: String(data.amount || ''),
                expense_date: data.expense_date || new Date().toISOString().split('T')[0],
                description: data.description || '',
            })
        } catch (error: unknown) {
            toast.error(friendlyError(error))
            router.push('/dashboard/expenses')
        } finally {
            setFetching(false)
        }
    }, [editId, router])

    useEffect(() => {
        if (editId) {
            fetchExpense()
        }
    }, [editId, fetchExpense])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const validationErrors: Partial<Record<keyof ExpenseForm, string>> = {}
        ;(Object.keys(DEFAULT_FORM) as (keyof ExpenseForm)[]).forEach((key) => {
            const msg = fieldError(key, form)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const payload = {
                ...form,
                user_id: userData.user.id,
                amount: parseFloat(form.amount) || 0,
            }

            if (editId) {
                const { error } = await supabase
                    .from('expenses')
                    .update(payload)
                    .eq('id', editId)
                if (error) throw error
                toast.success('Expense updated successfully')
            } else {
                const { error } = await supabase
                    .from('expenses')
                    .insert([payload])
                if (error) throw error
                toast.success('Expense added successfully')
            }
            setSaved(true)
            setDirty(false)
            setTimeout(() => router.push('/dashboard/expenses'), 500)
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (!confirmLeave()) return
        router.push('/dashboard/expenses')
    }

    if (fetching) {
        return (
            <div className="max-w-3xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading expense details...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 px-4 md:px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-slate-900 dark:bg-primary/5 p-6 md:p-10 rounded-[32px] text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <Link href="/dashboard/expenses" aria-label="Back to expenses">
                        <button
                            type="button"
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-white">arrow_back</span>
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
                            {editId ? 'Update' : 'Record'} <span className="text-primary">Expense</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">
                            {editId ? 'Modify existing spending details.' : 'Classify your spending for better tax tracking.'}
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
                    Required fields are marked with *
                </div>
            </div>

            <form id="expense-form" onSubmit={handleSubmit} noValidate className="space-y-6">
                <FormSection
                    title="Expense details"
                    description="Describe the expense, its category, and how much it cost."
                    icon={<span className="material-symbols-outlined text-[22px]" aria-hidden="true">receipt_long</span>}
                >
                    <FormField label="Title / description" required error={errors.title}>
                        {({ id, describedBy, invalid }) => (
                            <SmartInput
                                id={id}
                                aria-describedby={describedBy}
                                aria-invalid={invalid}
                                invalid={invalid}
                                icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">title</span>}
                                placeholder="e.g. Monthly Office Rent"
                                maxLength={120}
                                transform="words"
                                trimOnBlur
                                value={form.title}
                                onChange={(e) => update('title', e.target.value)}
                                onBlur={() => blurValidate('title')}
                            />
                        )}
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Category" description="Selecting a category keeps your tax grouping clean.">
                            {({ id, describedBy }) => (
                                <SmartSelect
                                    id={id}
                                    aria-describedby={describedBy}
                                    value={form.category}
                                    onChange={(e) => update('category', e.target.value)}
                                >
                                    {EXPENSE_CATEGORIES.map((c) => (
                                        <option key={c} value={c === 'General' ? '' : c}>{c}</option>
                                    ))}
                                </SmartSelect>
                            )}
                        </FormField>

                        <FormField label="Amount" required description="Include all taxes and charges." error={errors.amount}>
                            {({ id, describedBy, invalid }) => (
                                <SmartNumberInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid}
                                    invalid={invalid}
                                    prefix="₹"
                                    decimals={2}
                                    min={0}
                                    placeholder="0.00"
                                    value={form.amount}
                                    onValueChange={updateAmount}
                                    onBlur={() => blurValidate('amount')}
                                />
                            )}
                        </FormField>
                    </div>

                    <FormField label="Expense date">
                        {({ id, describedBy }) => (
                            <div className="max-w-xs">
                                <SmartInput
                                    id={id}
                                    aria-describedby={describedBy}
                                    type="date"
                                    value={form.expense_date}
                                    onChange={(e) => update('expense_date', e.target.value)}
                                />
                            </div>
                        )}
                    </FormField>

                    <FormField label="Notes">
                        {({ id, describedBy }) => (
                            <SmartTextarea
                                id={id}
                                aria-describedby={describedBy}
                                rows={3}
                                maxLength={500}
                                placeholder="Additional notes about this expense..."
                                value={form.description}
                                onChange={(e) => update('description', e.target.value)}
                            />
                        )}
                    </FormField>
                </FormSection>

                <FormActions
                    formId="expense-form"
                    onCancel={handleCancel}
                    saving={loading}
                    success={saved}
                    dirty={dirty}
                    saveLabel={editId ? 'Update expense' : 'Confirm expense'}
                />
            </form>
        </div>
    )
}
