'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function InvoicesPage() {
    const router = useRouter()
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchInvoices()
    }, [])

    async function fetchInvoices() {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
          *,
          customers ( name )
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setInvoices(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredInvoices = invoices.filter(inv =>
        (inv.invoice_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (inv.customers?.name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-50 text-green-700 border-green-100'
            case 'partial': return 'bg-blue-50 text-blue-700 border-blue-100'
            default: return 'bg-yellow-50 text-yellow-700 border-yellow-100'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Sales Invoices</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Generate and manage your professional client billing.</p>
                </div>
                <Link href="/dashboard/invoices/create">
                    <button className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Generate Invoice
                    </button>
                </Link>
            </div>

            {/* Invoices Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative group max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Find by # or customer name..."
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
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document details</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billable Total</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInvoices.map((inv) => (
                                <tr
                                    key={inv.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <div>
                                            <p className="text-sm font-black text-blue-600 dark:text-blue-400 leading-tight group-hover:underline">{inv.invoice_number}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-tighter">Issue Date: {new Date(inv.invoice_date).toLocaleDateString()}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {inv.customers?.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{inv.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-slate-100">
                                        ₹ {(inv.total_amount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(inv.payment_status)}`}>
                                            {inv.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>

                                        <button
                                            onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-sm">No transaction records found matching the search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
