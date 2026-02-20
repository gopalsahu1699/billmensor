'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ReturnsPage() {
    const router = useRouter()
    const [returns, setReturns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchReturns()
    }, [])

    async function fetchReturns() {
        try {
            const { data, error } = await supabase
                .from('returns')
                .select(`
                    *,
                    customers!customer_id ( name )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setReturns(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredReturns = returns.filter(r =>
        (r.return_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (r.customers?.name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Post-Sales Adjustments</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage Credit & Debit notes for returns and reconciliation.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/dashboard/returns/create?type=sales_return">
                        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-orange-500/20 text-orange-600 dark:text-orange-400 px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all active:scale-95 shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_down</span>
                            Sales Return
                        </button>
                    </Link>
                    <Link href="/dashboard/returns/create?type=purchase_return">
                        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-blue-500/20 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all active:scale-95 shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_up</span>
                            Purchase Return
                        </button>
                    </Link>
                </div>
            </div>

            {/* Returns Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative group max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search by note ID or party name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustment info</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Refund Value</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Explore</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredReturns.map((r) => (
                                <tr
                                    key={r.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/returns/${r.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <div>
                                            <p className="text-sm font-black text-blue-600 dark:text-blue-400 leading-tight group-hover:underline">{r.return_number}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-tighter">Processed: {new Date(r.return_date).toLocaleDateString()}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-tighter ${r.type === 'sales_return' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'}`}>
                                            {r.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {r.customers?.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-slate-100">
                                        ₹ {r.total_amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-8 py-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => router.push(`/dashboard/returns/create?type=${r.type}&edit=${r.id}`)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/returns/${r.id}`)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredReturns.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-sm">No adjustment records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
