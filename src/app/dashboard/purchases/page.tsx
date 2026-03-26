'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePurchases } from '@/hooks/usePurchase'
import { toast } from 'sonner'

export default function PurchasesPage() {
    const router = useRouter()
    const { purchases, loading, error } = usePurchases()
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const filteredPurchases = purchases.filter(p =>
        (p.purchase_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (p.suppliers?.name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-600 dark:bg-green-900/30'
            case 'partial': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
            default: return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Stock Acquisitions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Record and manage your incoming inventory and supplier bills.</p>
                </div>
                <Link href="/dashboard/purchases/create">
                    <button className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                        New Purchase
                    </button>
                </Link>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Search by bill # or supplier name..."
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

            {/* Purchases Table */}
            <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Bill #</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Investment</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredPurchases.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm uppercase">
                                                {p.suppliers?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{p.suppliers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">{p.purchase_number}</td>
                                    <td className="px-8 py-6 text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(p.purchase_date).toLocaleDateString()}</td>
                                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-slate-100">₹{(p.total_amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(p.payment_status || 'unpaid')}`}>
                                            {p.payment_status || 'unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/dashboard/purchases/create?edit=${p.id}`)}
                                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => router.push(`/dashboard/purchases/${p.id}`)}
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
                                    <td colSpan={6} className="px-8 py-12 text-center">
                                        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredPurchases.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                                <span className="material-symbols-outlined text-[32px]">shopping_cart</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-tight italic">No Records Found</p>
                                                <p className="text-slate-500 text-xs mt-1">Start by recording your first stock acquisition.</p>
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
