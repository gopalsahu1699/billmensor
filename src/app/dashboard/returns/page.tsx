'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useReturns } from '@/hooks/useReturn'
import { toast } from 'sonner'
import {
    Search,
    Plus,
    Edit,
    ChevronRight,
    Loader2,
    RotateCcw
} from 'lucide-react'



function ReturnsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const typeFilter = searchParams.get('type') // 'sales_return' or 'purchase_return'

    const { returns: rawReturns, loading, error } = useReturns()
    const [search, setSearch] = useState('')

    // Apply client side type filter since useReturns fetches all
    const returns = typeFilter ? rawReturns.filter(r => r.type === typeFilter) : rawReturns

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const filteredReturns = returns.filter(r =>
        (r.return_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (r.party?.name?.toLowerCase() || r.customers?.name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const pageTitle = typeFilter === 'sales_return'
        ? 'Sales Returns'
        : typeFilter === 'purchase_return'
            ? 'Purchase Returns'
            : 'Post-Sales Adjustments'

    const pageDesc = typeFilter === 'sales_return'
        ? 'Manage customer returns and credit notes.'
        : typeFilter === 'purchase_return'
            ? 'Track vendor returns and debit notes.'
            : 'Manage Credit & Debit notes for returns and reconciliation.'

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header section with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 dark:bg-primary/5 p-8 md:p-12 rounded-[40px] text-white shadow-2xl border border-slate-800">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">
                        {pageTitle.split(' ')[0]} <span className="text-blue-500">{pageTitle.split(' ')[1] || ''}</span>
                    </h1>
                    <p className="text-slate-300 font-medium tracking-tight">
                        {pageDesc}
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    {(!typeFilter || typeFilter === 'sales_return') && (
                        <Link href="/dashboard/returns/create?type=sales_return">
                            <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20">
                                <Plus size={18} />
                                New Sales Return
                            </button>
                        </Link>
                    )}
                    {(!typeFilter || typeFilter === 'purchase_return') && (
                        <Link href="/dashboard/returns/create?type=purchase_return">
                            <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                                <Plus size={18} />
                                New Purchase Return
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Returns Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative group max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by note ID or party name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100 font-medium"
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
                                                {(r.party?.name || r.customers?.name)?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.party?.name || r.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-slate-100">
                                        ₹ {r.total_amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => router.push(`/dashboard/returns/create?type=${r.type}&edit=${r.id}`)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/returns/${r.id}`)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 rounded-xl transition-all"
                                            title="View Details"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="animate-spin text-blue-500" />
                                            <p className="text-sm font-medium text-slate-400">Loading adjustments...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredReturns.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-4">
                                            <RotateCcw size={48} className="text-slate-200 dark:text-slate-800" strokeWidth={1} />
                                            <p className="text-sm font-medium">No adjustment records found.</p>
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

export default function ReturnsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Adjustments...</div>}>
            <ReturnsContent />
        </Suspense>
    )
}
