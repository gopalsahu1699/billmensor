'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ExpensesPage() {
    const router = useRouter()
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchExpenses()
    }, [])

    async function fetchExpenses() {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return

            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('expense_date', { ascending: false })

            if (error) throw error
            setExpenses(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteExpense(id: string) {
        if (!confirm('Are you sure you want to delete this expense record?')) return

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Expense deleted successfully')
            fetchExpenses()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredExpenses = expenses.filter(e =>
        (e.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (e.category?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

    // Group expenses by category for quick stats
    const categoryTotals: Record<string, number> = {}
    expenses.forEach(e => {
        const cat = e.category || 'General'
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0)
    })
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Expense Tracker</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Track and categorize your business spending.</p>
                </div>
                <Link href="/dashboard/expenses/create">
                    <button className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Record Expense
                    </button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Spent</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">₹{totalExpenses.toLocaleString('en-IN')}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Entries</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{expenses.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                            <span className="material-symbols-outlined">category</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Category</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{topCategory ? topCategory[0] : '-'}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative group max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Filter by title or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredExpenses.map((expense) => (
                                <tr
                                    key={expense.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{expense.title}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {expense.category || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-500">
                                        {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-red-600">
                                        ₹{(expense.amount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/expenses/create?edit=${expense.id}`);
                                            }}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteExpense(expense.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                                <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-tight italic">No Expenses Record</p>
                                                <p className="text-slate-500 text-xs mt-1">Start recording your business expenses.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
