'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { toast } from 'sonner'
import { Plus, Search, ArrowDownLeft, Wallet, CreditCard, Banknote } from 'lucide-react'
import { cn } from '../../../lib/utils'

export default function PaymentInPage() {
    const router = useRouter()
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    customers ( name )
                `)
                .eq('type', 'payment_in')
                .order('created_at', { ascending: false })

            if (error) {
                if (error.code === '42P01') {
                    setPayments([])
                    return
                }
                throw error
            }
            setPayments(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredPayments = payments.filter(pmt =>
        (pmt.payment_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (pmt.customers?.name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const getModeIcon = (mode: string) => {
        switch ((mode || 'cash').toLowerCase()) {
            case 'bank': return <Banknote size={16} />
            case 'upi': return <ArrowDownLeft size={16} />
            default: return <Wallet size={16} />
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Payment In</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">Record payments received from customers. Maintain a clean transaction ledger.</p>
                </div>
                <Link href="/dashboard/payments-in/create">
                    <button className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-green-600/20 active:scale-95">
                        <Plus size={20} strokeWidth={3} />
                        Record Payment
                    </button>
                </Link>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative group w-full max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by # or party name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-blue-500/20 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 transition-all outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100 font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Receipt Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                            {filteredPayments.map((pmt) => (
                                <tr
                                    key={pmt.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/payments-in/${pmt.id}`)}
                                >
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-sm font-black text-green-600 dark:text-green-400 leading-tight group-hover:underline">{pmt.payment_number}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 uppercase font-black tracking-widest">Date: {new Date(pmt.payment_date).toLocaleDateString()}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-green-600/10 group-hover:text-green-500 group-hover:border-green-600/20 transition-all">
                                                {pmt.customers?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-green-500 transition-colors">{pmt.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">₹ {pmt.amount.toLocaleString('en-IN')}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                                                {getModeIcon(pmt.mode)}
                                                {pmt.mode}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => router.push(`/dashboard/payments-in/${pmt.id}`)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title="View"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-4">
                                            <Wallet size={48} className="text-slate-200 dark:text-slate-800" strokeWidth={1} />
                                            <p className="text-sm font-medium">No payment records found. Keep track of your customer receipts here.</p>
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
