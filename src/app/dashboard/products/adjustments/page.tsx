'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IoMdAdd, IoMdArrowUp, IoMdArrowDown } from 'react-icons/io'
import { IoList } from 'react-icons/io5'
import { toast } from 'sonner'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FormField } from '@/components/ui/form/FormField'
import { FormActions } from '@/components/ui/form/FormActions'
import { SmartSelect, SmartNumberInput, SmartTextarea } from '@/components/ui/form/smart-inputs'
import { friendlyError } from '@/lib/friendly-errors'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface StockAdjustment {
    id: string
    products?: { name: string } | null
    adjustment_type: 'add' | 'reduce'
    quantity: number
    reason?: string | null
    created_at: string
}

interface ProductStock {
    id: string
    name: string
    stock_quantity: number
}

interface AdjustmentForm {
    product_id: string
    adjustment_type: 'add' | 'reduce'
    quantity: number
    reason: string
}

interface AdjustmentErrors {
    product_id?: string
    quantity?: string
}

function fieldError(key: keyof AdjustmentErrors, f: AdjustmentForm): string | undefined {
    if (key === 'product_id') {
        return f.product_id ? undefined : 'Please select a product.'
    }
    if (key === 'quantity') {
        if (!f.quantity || isNaN(f.quantity)) return 'Please enter a quantity.'
        if (f.quantity < 1) return 'Quantity must be at least 1.'
        return undefined
    }
}

export default function StockAdjustmentsPage() {
    const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
    const [products, setProducts] = useState<ProductStock[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState<AdjustmentForm>({
        product_id: '',
        adjustment_type: 'add',
        quantity: 1,
        reason: ''
    })
    const [errors, setErrors] = useState<AdjustmentErrors>({})

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (!showModal) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowModal(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showModal])

    async function fetchData() {
        try {
            const [adjRes, prodRes] = await Promise.all([
                supabase.from('stock_adjustments').select('*, products(name)').order('created_at', { ascending: false }),
                supabase.from('products').select('id, name, stock_quantity').order('name')
            ])
            setAdjustments(adjRes.data || [])
            setProducts(prodRes.data || [])
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setLoading(false)
        }
    }

    const openModal = () => {
        setErrors({})
        setForm({ product_id: '', adjustment_type: 'add', quantity: 1, reason: '' })
        setShowModal(true)
    }

    const updateString = (key: 'product_id' | 'reason', value: string) => {
        setForm((f) => ({ ...f, [key]: value }))
        if (key === 'product_id') {
            setErrors((e) => (e.product_id ? { ...e, product_id: '' } : e))
        }
    }

    const updateQuantity = (value: number) => {
        setForm((f) => ({ ...f, quantity: value }))
        setErrors((e) => (e.quantity ? { ...e, quantity: '' } : e))
    }

    const setType = (t: 'add' | 'reduce') => {
        setForm((f) => ({ ...f, adjustment_type: t }))
    }

    const blurValidate = (key: keyof AdjustmentErrors) => {
        const msg = fieldError(key, form)
        setErrors((e) => ({ ...e, [key]: msg ?? '' }))
    }

    async function handleAddAdjustment(e: React.FormEvent) {
        e.preventDefault()
        const validationErrors: AdjustmentErrors = {}
        ;(['product_id', 'quantity'] as (keyof AdjustmentErrors)[]).forEach((key) => {
            const msg = fieldError(key, form)
            if (msg) validationErrors[key] = msg
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
            return
        }

        setSaving(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            // 1. Log Adjustment
            const { error: adjError } = await supabase
                .from('stock_adjustments')
                .insert([{ ...form, user_id: userData.user.id }])

            if (adjError) throw adjError

            // 2. Update Product Stock
            const product = products.find(p => p.id === form.product_id)
            if (product) {
                const newQty = form.adjustment_type === 'add'
                    ? product.stock_quantity + form.quantity
                    : product.stock_quantity - form.quantity

                const { error: prodError } = await supabase
                    .from('products')
                    .update({ stock_quantity: newQty })
                    .eq('id', form.product_id)

                if (prodError) throw prodError
            }

            toast.success('Stock adjusted successfully')
            setShowModal(false)
            setErrors({})
            setForm({ product_id: '', adjustment_type: 'add', quantity: 1, reason: '' })
            fetchData()
        } catch (error: unknown) {
            toast.error(friendlyError(error))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <IoList className="text-blue-600" /> Stock Adjustments
                    </h1>
                    <p className="text-slate-500">Log manual stock changes for wastage, damages, or corrections.</p>
                </div>
                <Button onClick={openModal} className="flex items-center gap-2">
                    <IoMdAdd size={18} /> New Adjustment
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Adjustment History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : adjustments.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 italic">
                            No stock adjustments recorded yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                                        <th className="py-4">Product</th>
                                        <th className="py-4">Change</th>
                                        <th className="py-4">Reason</th>
                                        <th className="py-4 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {adjustments.map((adj) => (
                                        <tr key={adj.id}>
                                            <td className="py-4 font-medium text-slate-900">{adj.products?.name}</td>
                                            <td className="py-4">
                                                <div className={cn(
                                                    "flex items-center gap-1 font-bold",
                                                    adj.adjustment_type === 'add' ? "text-green-600" : "text-red-500"
                                                )}>
                                                    {adj.adjustment_type === 'add' ? <IoMdArrowUp size={14} /> : <IoMdArrowDown size={14} />}
                                                    {adj.quantity}
                                                </div>
                                            </td>
                                            <td className="py-4 text-slate-600 text-sm italic">{adj.reason || '-'}</td>
                                            <td className="py-4 text-right text-slate-400 text-xs">
                                                {new Date(adj.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Adjustment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="adjustment-modal-title"
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 id="adjustment-modal-title" className="text-xl font-bold text-slate-900">Manual Stock Adjustment</h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                aria-label="Close adjustment dialog"
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <IoMdAdd size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form id="adjustment-form" onSubmit={handleAddAdjustment} noValidate className="p-6 space-y-4">
                            <FormField label="Select product" required error={errors.product_id}>
                                {({ id, describedBy, invalid }) => (
                                    <SmartSelect
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={invalid}
                                        invalid={invalid}
                                        placeholderOption="Choose item..."
                                        value={form.product_id}
                                        onChange={(e) => updateString('product_id', e.target.value)}
                                        onBlur={() => blurValidate('product_id')}
                                    >
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Current: {p.stock_quantity})</option>
                                        ))}
                                    </SmartSelect>
                                )}
                            </FormField>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Action">
                                    {({ labelId }) => (
                                        <div role="radiogroup" aria-labelledby={labelId} className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={form.adjustment_type === 'add'}
                                                onClick={() => setType('add')}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                                    form.adjustment_type === 'add' ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                Add (+)
                                            </button>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={form.adjustment_type === 'reduce'}
                                                onClick={() => setType('reduce')}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                                    form.adjustment_type === 'reduce' ? "bg-white text-red-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                Reduce (-)
                                            </button>
                                        </div>
                                    )}
                                </FormField>
                                <FormField label="Quantity" required error={errors.quantity}>
                                    {({ id, describedBy, invalid }) => (
                                        <SmartNumberInput
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={invalid}
                                            invalid={invalid}
                                            decimals={0}
                                            min={1}
                                            showSteppers
                                            placeholder="1"
                                            value={form.quantity}
                                            onValueChange={(v) => updateQuantity(v ?? 0)}
                                            onBlur={() => blurValidate('quantity')}
                                        />
                                    )}
                                </FormField>
                            </div>
                            <FormField label="Reason / remarks" description="Optional note, e.g. damage during shipping or wastage.">
                                {({ id, describedBy }) => (
                                    <SmartTextarea
                                        id={id}
                                        aria-describedby={describedBy}
                                        rows={3}
                                        maxLength={300}
                                        placeholder="e.g. Damage during shipping, wastage, etc."
                                        value={form.reason}
                                        onChange={(e) => updateString('reason', e.target.value)}
                                    />
                                )}
                            </FormField>
                            <FormActions
                                formId="adjustment-form"
                                onCancel={() => setShowModal(false)}
                                saving={saving}
                                saveLabel="Record adjustment"
                                cancelLabel="Cancel"
                                sticky={false}
                            />
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
