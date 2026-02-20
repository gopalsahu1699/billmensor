'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CreateExpensePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(!!editId)
    const [form, setForm] = useState({
        title: '',
        category: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
    })

    useEffect(() => {
        if (editId) fetchExpense()
    }, [editId])

    async function fetchExpense() {
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
        } catch (error: any) {
            toast.error(error.message)
            router.push('/dashboard/expenses')
        } finally {
            setFetching(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
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
            router.push('/dashboard/expenses')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="max-w-3xl mx-auto py-20 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-slate-500 font-medium">Loading expense details...</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/expenses">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">
                        {editId ? 'Update Expense' : 'Record New Expense'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {editId ? 'Modify existing spending details.' : 'Classify your spending for better tax tracking.'}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Title / Description *</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">title</span>
                            <input
                                required
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="e.g. Monthly Office Rent"
                            />
                        </div>
                    </div>

                    {/* Category and Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Category</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">category</span>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 appearance-none"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="">General</option>
                                    <option value="Rent">Rent</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Taxes">Taxes</option>
                                    <option value="Office Supplies">Office Supplies</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Amount (₹) *</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">currency_rupee</span>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Expense Date</label>
                        <div className="relative max-w-xs">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
                            <input
                                type="date"
                                value={form.expense_date}
                                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]">notes</span>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder="Additional notes about this expense..."
                            />
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <Link href="/dashboard/expenses">
                        <button type="button" className="px-8 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all">
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        {loading ? 'Processing...' : (editId ? 'Update Expense' : 'Confirm Expense')}
                    </button>
                </div>
            </form>
        </div>
    )
}
