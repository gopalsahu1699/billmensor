'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { MdCalendarToday, MdReceipt, MdAccountBalance, MdTrendingUp, MdTrendingDown } from 'react-icons/md'

interface Transaction {
    id: string
    type: 'invoice' | 'payment_in' | 'payment_out' | 'expense'
    date: string
    description: string
    amount: number
    reference?: string
    party?: string
}

interface DaySummary {
    totalReceipts: number
    totalPayments: number
    totalExpenses: number
    openingBalance: number
    closingBalance: number
}

export default function DayBookPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [summary, setSummary] = useState<DaySummary>({
        totalReceipts: 0,
        totalPayments: 0,
        totalExpenses: 0,
        openingBalance: 0,
        closingBalance: 0
    })
    const [loading, setLoading] = useState(true)

    const fetchDayBook = useCallback(async () => {
        try {
            setLoading(true)
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')
            const uid = userData.user.id

            const [invoicesRes, paymentsInRes, paymentsOutRes, expensesRes] = await Promise.all([
                supabase.from('invoices')
                    .select('id, invoice_number, invoice_date, total_amount, customers(name)')
                    .eq('user_id', uid)
                    .gte('invoice_date', selectedDate)
                    .lte('invoice_date', selectedDate),
                supabase.from('payments')
                    .select('id, payment_number, payment_date, amount, customers(name)')
                    .eq('user_id', uid)
                    .eq('type', 'payment_in')
                    .gte('payment_date', selectedDate)
                    .lte('payment_date', selectedDate),
                supabase.from('payments')
                    .select('id, payment_number, payment_date, amount, customers(name)')
                    .eq('user_id', uid)
                    .eq('type', 'payment_out')
                    .gte('payment_date', selectedDate)
                    .lte('payment_date', selectedDate),
                supabase.from('expenses')
                    .select('id, title, expense_date, amount')
                    .eq('user_id', uid)
                    .gte('expense_date', selectedDate)
                    .lte('expense_date', selectedDate)
            ])

            const allTransactions: Transaction[] = []

            // Map invoices
            ;(invoicesRes.data || []).forEach(inv => {
                allTransactions.push({
                    id: inv.id,
                    type: 'invoice',
                    date: inv.invoice_date,
                    description: `Invoice ${inv.invoice_number}`,
                    amount: inv.total_amount || 0,
                    reference: inv.invoice_number,
                    party: (inv.customers as unknown as { name?: string } | null)?.name || 'Walk-in'
                })
            })

            // Map payments in
            ;(paymentsInRes.data || []).forEach(pay => {
                allTransactions.push({
                    id: pay.id,
                    type: 'payment_in',
                    date: pay.payment_date,
                    description: `Payment received - ${pay.payment_number}`,
                    amount: pay.amount || 0,
                    reference: pay.payment_number,
                    party: (pay.customers as unknown as { name?: string } | null)?.name || 'Walk-in'
                })
            })

            // Map payments out
            ;(paymentsOutRes.data || []).forEach(pay => {
                allTransactions.push({
                    id: pay.id,
                    type: 'payment_out',
                    date: pay.payment_date,
                    description: `Payment made - ${pay.payment_number}`,
                    amount: pay.amount || 0,
                    reference: pay.payment_number,
                    party: (pay.customers as unknown as { name?: string } | null)?.name || 'Supplier'
                })
            })

            // Map expenses
            ;(expensesRes.data || []).forEach(exp => {
                allTransactions.push({
                    id: exp.id,
                    type: 'expense',
                    date: exp.expense_date,
                    description: exp.title || 'Expense',
                    amount: exp.amount || 0
                })
            })

            // Sort by date
            allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            setTransactions(allTransactions)

            // Calculate summary
            const totalReceipts = allTransactions
                .filter(t => t.type === 'payment_in')
                .reduce((sum, t) => sum + t.amount, 0)
            const totalPayments = allTransactions
                .filter(t => t.type === 'payment_out')
                .reduce((sum, t) => sum + t.amount, 0)
            const totalExpenses = allTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)

            // Get previous day balance
            const prevDate = new Date(selectedDate)
            prevDate.setDate(prevDate.getDate() - 1)
            const prevDateStr = prevDate.toISOString().split('T')[0]

            const { data: prevPayments } = await supabase.from('payments')
                .select('amount, type')
                .eq('user_id', uid)
                .lte('payment_date', prevDateStr)

            const openingBalance = (prevPayments || []).reduce((sum: number, p) => {
                if (p.type === 'payment_in') return sum + (p.amount || 0)
                if (p.type === 'payment_out') return sum - (p.amount || 0)
                return sum
            }, 0)

            setSummary({
                totalReceipts,
                totalPayments,
                totalExpenses,
                openingBalance,
                closingBalance: openingBalance + totalReceipts - totalPayments - totalExpenses
            })

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to fetch day book'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => {
        fetchDayBook()
    }, [fetchDayBook])

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'invoice': return <MdReceipt className="text-blue-500" size={20} />
            case 'payment_in': return <MdTrendingUp className="text-green-500" size={20} />
            case 'payment_out': return <MdTrendingDown className="text-red-500" size={20} />
            case 'expense': return <MdAccountBalance className="text-orange-500" size={20} />
            default: return <MdReceipt className="text-slate-500" size={20} />
        }
    }

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'invoice': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
            case 'payment_in': return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
            case 'payment_out': return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
            case 'expense': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'
            default: return 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
        }
    }

    const getAmountColor = (type: string) => {
        switch (type) {
            case 'invoice': return 'text-blue-600 dark:text-blue-400'
            case 'payment_in': return 'text-green-600 dark:text-green-400'
            case 'payment_out': return 'text-red-600 dark:text-red-400'
            case 'expense': return 'text-orange-600 dark:text-orange-400'
            default: return 'text-slate-600 dark:text-slate-400'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight italic uppercase">Day Book</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">View all transactions for a specific day.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Opening Balance</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">₹{summary.openingBalance.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Receipts</p>
                    <h3 className="text-xl font-black text-green-600 dark:text-green-400 mt-1">₹{summary.totalReceipts.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Payments</p>
                    <h3 className="text-xl font-black text-red-600 dark:text-red-400 mt-1">₹{summary.totalPayments.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Expenses</p>
                    <h3 className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">₹{summary.totalExpenses.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Closing Balance</p>
                    <h3 className="text-xl font-black text-primary mt-1">₹{summary.closingBalance.toLocaleString('en-IN')}</h3>
                </div>
            </div>

            {/* Transactions Timeline */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 italic uppercase">Transactions</h2>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <MdReceipt className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No transactions found for this date.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((txn) => (
                                <div
                                    key={txn.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border ${getTransactionColor(txn.type)} transition-all hover:shadow-sm`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                        {getTransactionIcon(txn.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{txn.description}</p>
                                        {txn.party && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{txn.party}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${getAmountColor(txn.type)}`}>
                                            {txn.type === 'payment_out' || txn.type === 'expense' ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{txn.type.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
