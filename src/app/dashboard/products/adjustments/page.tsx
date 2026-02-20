'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Package, ArrowUp, ArrowDown, History, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function StockAdjustmentsPage() {
    const [adjustments, setAdjustments] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        product_id: '',
        adjustment_type: 'add' as 'add' | 'reduce',
        quantity: 1,
        reason: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [adjRes, prodRes] = await Promise.all([
                supabase.from('stock_adjustments').select('*, products(name)').order('created_at', { ascending: false }),
                supabase.from('products').select('id, name, stock_quantity').order('name')
            ])
            setAdjustments(adjRes.data || [])
            setProducts(prodRes.data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddAdjustment(e: React.FormEvent) {
        e.preventDefault()
        if (!form.product_id) return toast.error('Please select a product')

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
            setForm({ product_id: '', adjustment_type: 'add', quantity: 1, reason: '' })
            fetchData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" /> Stock Adjustments
                    </h1>
                    <p className="text-slate-500">Log manual stock changes for wastage, damages, or corrections.</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                    <Plus size={18} /> New Adjustment
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
                                                    {adj.adjustment_type === 'add' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Manual Stock Adjustment</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleAddAdjustment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Product *</label>
                                <select
                                    required
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={form.product_id}
                                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                                >
                                    <option value="">Choose item...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Current: {p.stock_quantity})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, adjustment_type: 'add' })}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                                                form.adjustment_type === 'add' ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Add (+)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, adjustment_type: 'reduce' })}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                                                form.adjustment_type === 'reduce' ? "bg-white text-red-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Reduce (-)
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                                    <Input
                                        type="number"
                                        required
                                        min="1"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Remarks</label>
                                <textarea
                                    className="w-full h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Damage during shipping, wastage, etc."
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 bg-blue-600" isLoading={saving}>Record Adjustment</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
