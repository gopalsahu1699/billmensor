'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { SelectorModal } from '@/components/ui/SelectorModal'

interface Party {
    id: string
    name: string
    phone?: string
    email?: string
}

interface LedgerEntry {
    id: string
    date: string
    type: 'invoice' | 'payment' | 'return' | 'purchase'
    description: string
    debit: number
    credit: number
    balance: number
    reference?: string
}

export default function PartyLedgerPage() {
    const [parties, setParties] = useState<Party[]>([])
    const [selectedParty, setSelectedParty] = useState<Party | null>(null)
    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [summary, setSummary] = useState({
        openingBalance: 0,
        closingBalance: 0,
        totalDebit: 0,
        totalCredit: 0
    })
    const [loading, setLoading] = useState(false)

    const fetchParties = useCallback(async () => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('customers')
                .select('id, name, phone, email')
                .eq('user_id', userData.user.id)
                .order('name')

            if (error) throw error
            setParties((data as Party[]) || [])
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to fetch parties'
            toast.error(msg)
        }
    }, [])

    const fetchLedger = useCallback(async () => {
        if (!selectedParty) return

        try {
            setLoading(true)
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')
            const uid = userData.user.id

            const allEntries: LedgerEntry[] = []

            // Fetch invoices for this party
            const { data: invoices } = await supabase
                .from('invoices')
                .select('id, invoice_number, invoice_date, total_amount, amount_paid')
                .eq('user_id', uid)
                .eq('customer_id', selectedParty.id)
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)
                .order('invoice_date', { ascending: true })

            ;(invoices || []).forEach(inv => {
                allEntries.push({
                    id: inv.id,
                    date: inv.invoice_date,
                    type: 'invoice',
                    description: `Invoice ${inv.invoice_number}`,
                    debit: inv.total_amount || 0,
                    credit: inv.amount_paid || 0,
                    balance: 0,
                    reference: inv.invoice_number
                })
            })

            // Fetch payments received from this party
            const { data: payments } = await supabase
                .from('payments')
                .select('id, payment_number, payment_date, amount')
                .eq('user_id', uid)
                .eq('customer_id', selectedParty.id)
                .eq('type', 'payment_in')
                .gte('payment_date', dateRange.start)
                .lte('payment_date', dateRange.end)
                .order('payment_date', { ascending: true })

            ;(payments || []).forEach(pay => {
                allEntries.push({
                    id: pay.id,
                    date: pay.payment_date,
                    type: 'payment',
                    description: `Payment received - ${pay.payment_number}`,
                    debit: 0,
                    credit: pay.amount || 0,
                    balance: 0,
                    reference: pay.payment_number
                })
            })

            // Fetch sales returns
            const { data: returns } = await supabase
                .from('returns')
                .select('id, return_number, return_date, total_amount')
                .eq('user_id', uid)
                .eq('customer_id', selectedParty.id)
                .eq('type', 'sales_return')
                .gte('return_date', dateRange.start)
                .lte('return_date', dateRange.end)
                .order('return_date', { ascending: true })

            ;(returns || []).forEach(ret => {
                allEntries.push({
                    id: ret.id,
                    date: ret.return_date,
                    type: 'return',
                    description: `Sales Return ${ret.return_number}`,
                    debit: 0,
                    credit: ret.total_amount || 0,
                    balance: 0,
                    reference: ret.return_number
                })
            })

            // Sort by date
            allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            // Calculate running balance
            let runningBalance = 0
            allEntries.forEach(entry => {
                runningBalance += entry.debit - entry.credit
                entry.balance = runningBalance
            })

            // Get opening balance (before dateRange.start)
            const { data: prevInvoices } = await supabase
                .from('invoices')
                .select('total_amount, amount_paid')
                .eq('user_id', uid)
                .eq('customer_id', selectedParty.id)
                .lt('invoice_date', dateRange.start)

            const { data: prevPayments } = await supabase
                .from('payments')
                .select('amount')
                .eq('user_id', uid)
                .eq('customer_id', selectedParty.id)
                .eq('type', 'payment_in')
                .lt('payment_date', dateRange.start)

            const { data: prevReturns } = await supabase
                .from('returns')
                .select('total_amount')
                .eq('user_id', uid)
                .eq('customer_id', selectedParty.id)
                .eq('type', 'sales_return')
                .lt('return_date', dateRange.start)

            const openingBalance = (prevInvoices || []).reduce((sum: number, inv: { total_amount?: number; amount_paid?: number }) => sum + (inv.total_amount || 0) - (inv.amount_paid || 0), 0)
                - (prevPayments || []).reduce((sum: number, pay: { amount?: number }) => sum + (pay.amount || 0), 0)
                + (prevReturns || []).reduce((sum: number, ret: { total_amount?: number }) => sum + (ret.total_amount || 0), 0)

            setEntries(allEntries)
            setSummary({
                openingBalance,
                closingBalance: openingBalance + runningBalance,
                totalDebit: allEntries.reduce((sum, e) => sum + e.debit, 0),
                totalCredit: allEntries.reduce((sum, e) => sum + e.credit, 0)
            })

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to fetch ledger'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }, [selectedParty, dateRange])

    useEffect(() => {
        fetchParties()
    }, [fetchParties])

    useEffect(() => {
        fetchLedger()
    }, [fetchLedger])

    const getEntryColor = (type: string) => {
        switch (type) {
            case 'invoice': return 'text-blue-600 dark:text-blue-400'
            case 'payment': return 'text-green-600 dark:text-green-400'
            case 'return': return 'text-orange-600 dark:text-orange-400'
            case 'purchase': return 'text-purple-600 dark:text-purple-400'
            default: return 'text-slate-600 dark:text-slate-400'
        }
    }

    return (

<div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Party Ledger</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">View complete transaction history for any party.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Select Party</label>
                        <button
                            type="button"
                            onClick={() => setIsPartyModalOpen(true)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm text-left focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                        >
                            <span className={selectedParty ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
                                {selectedParty ? selectedParty.name : "Search Party..."}
                            </span>
                        </button>
                        <SelectorModal
                            isOpen={isPartyModalOpen}
                            onClose={() => setIsPartyModalOpen(false)}
                            title="Select Party"
                            items={parties}
                            searchKeys={['name', 'phone', 'email']}
                            valueKey="id"
                            selectedValue={selectedParty?.id}
                            onSelect={(p) => setSelectedParty(p)}
                            renderItem={(p) => (
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors uppercase tracking-tight">{p.name}</span>
                                    <span className="text-xs text-slate-500">{p.phone || 'No phone'} • {p.email || 'No email'}</span>
                                </div>
                            )}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">From</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">To</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {selectedParty && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Opening Balance</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">₹{summary.openingBalance.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Total Debit (Invoices)</p>
                        <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{summary.totalDebit.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Total Credit (Payments)</p>
                        <h3 className="text-xl font-black text-green-600 dark:text-green-400 mt-1">₹{summary.totalCredit.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Closing Balance</p>
                        <h3 className="text-xl font-black text-primary mt-1">₹{summary.closingBalance.toLocaleString('en-IN')}</h3>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            {selectedParty && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 italic uppercase">
                            Ledger for {selectedParty.name}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Debit</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Credit</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-8 py-5" colSpan={5}><div className="h-8 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" /></td>
                                        </tr>
                                    ))
                                ) : entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic text-sm">
                                            No transactions found for this party in the selected date range.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {summary.openingBalance !== 0 && (
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                                <td className="px-8 py-4 text-sm font-bold text-slate-500">{dateRange.start}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-500 italic">Opening Balance</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-500 text-right">-</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-500 text-right">-</td>
                                                <td className="px-8 py-4 text-sm font-black text-right">₹{summary.openingBalance.toLocaleString('en-IN')}</td>
                                            </tr>
                                        )}
                                        {entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-8 py-4 text-sm text-slate-600 dark:text-slate-400">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                                                <td className="px-8 py-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{entry.description}</p>
                                                    {entry.reference && (
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Ref: {entry.reference}</p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4 text-sm font-black text-right">
                                                    {entry.debit > 0 ? <span className={getEntryColor(entry.type)}>₹{entry.debit.toLocaleString('en-IN')}</span> : '-'}
                                                </td>
                                                <td className="px-8 py-4 text-sm font-black text-right">
                                                    {entry.credit > 0 ? <span className="text-green-600 dark:text-green-400">₹{entry.credit.toLocaleString('en-IN')}</span> : '-'}
                                                </td>
                                                <td className="px-8 py-4 text-sm font-black text-right">₹{entry.balance.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        )
}
