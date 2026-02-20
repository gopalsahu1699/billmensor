'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function QuotationsPage() {
    const router = useRouter()
    const [quotations, setQuotations] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchQuotations()
    }, [])

    async function fetchQuotations() {
        try {
            setLoading(true)
            // Reverted to use customers table
            const { data, error } = await supabase
                .from('quotations')
                .select('*, customers(name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setQuotations(data || [])
        } catch (error) {
            console.error('Error fetching quotations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredQuotations = quotations.filter(q =>
        (q.quotation_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (q.customers?.name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Quotations</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage proforma invoices and sales estimates.</p>
                </div>
                <Link href="/dashboard/quotations/create">
                    <button className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Generate Quote
                    </button>
                </Link>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Search by quote # or client name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100 font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        Filter
                    </button>
                </div>
            </div>

            {/* Quotations Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Quote #</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredQuotations.map((q) => (
                                <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                {q.customers?.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{q.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">{q.quotation_number}</td>
                                    <td className="px-8 py-6 text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(q.quotation_date).toLocaleDateString()}</td>
                                    <td className="px-8 py-6 text-sm font-medium text-slate-500 dark:text-slate-400">{q.expiry_date ? new Date(q.expiry_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-slate-100">₹{(q.total_amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${q.status === 'accepted' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                            q.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                            }`}>
                                            {q.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">

                                            <button
                                                onClick={() => router.push(`/dashboard/quotations/${q.id}`)}

                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-12 text-center">
                                        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredQuotations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                                <span className="material-symbols-outlined text-[32px]">assignment</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-tight italic">No Quotations Found</p>
                                                <p className="text-slate-500 text-xs mt-1">Start by generating your first sales estimate.</p>
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
