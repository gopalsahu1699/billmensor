'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { 
    MdTrendingUp, MdTrendingDown, MdWallet, MdArrowUpward, 
    MdArrowDownward, MdCalendarToday, MdRefresh, MdFilterList
} from 'react-icons/md'

interface CashFlowData {
    date: string
    income: number
    expense: number
    balance: number
}

export default function CashFlowPage() {
    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState<CashFlowData[]>([])
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    })

    useEffect(() => {
        fetchCashFlow()
    }, [dateRange])

    async function fetchCashFlow() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Fetch payments in
            const { data: paymentsIn } = await supabase
                .from('payments')
                .select('amount, payment_date')
                .eq('user_id', user.id)
                .eq('type', 'payment_in')
                .gte('payment_date', dateRange.start)
                .lte('payment_date', dateRange.end)

            // Fetch payments out
            const { data: paymentsOut } = await supabase
                .from('payments')
                .select('amount, payment_date')
                .eq('user_id', user.id)
                .eq('type', 'payment_out')
                .gte('payment_date', dateRange.start)
                .lte('payment_date', dateRange.end)

            // Fetch expenses
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount, expense_date')
                .eq('user_id', user.id)
                .gte('expense_date', dateRange.start)
                .lte('expense_date', dateRange.end)

            // Fetch paid invoices
            const { data: invoices } = await supabase
                .from('invoices')
                .select('total_amount, invoice_date')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end)

            // Fetch paid purchases
            const { data: purchases } = await supabase
                .from('purchases')
                .select('total_amount, purchase_date')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .gte('purchase_date', dateRange.start)
                .lte('purchase_date', dateRange.end)

            // Calculate totals
            const totalIncome = 
                (paymentsIn?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0) +
                (invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0)

            const totalExpense = 
                (paymentsOut?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0) +
                (expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0) +
                (purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0)

            setSummary({
                income: totalIncome,
                expense: totalExpense,
                balance: totalIncome - totalExpense
            })

            // Create daily breakdown
            const dailyData: Record<string, CashFlowData> = {}
            
            const addTransaction = (date: string, income: number, expense: number) => {
                if (!dailyData[date]) {
                    dailyData[date] = { date, income: 0, expense: 0, balance: 0 }
                }
                dailyData[date].income += income
                dailyData[date].expense += expense
            }

            paymentsIn?.forEach(p => addTransaction(p.payment_date, p.amount || 0, 0))
            paymentsOut?.forEach(p => addTransaction(p.payment_date, 0, p.amount || 0))
            expenses?.forEach(e => addTransaction(e.expense_date, 0, e.amount || 0))
            invoices?.forEach(i => addTransaction(i.invoice_date, i.total_amount || 0, 0))
            purchases?.forEach(p => addTransaction(p.purchase_date, 0, p.total_amount || 0))

            // Convert to array and sort by date
            const sortedTransactions = Object.values(dailyData)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(t => ({
                    ...t,
                    balance: t.income - t.expense
                }))

            setTransactions(sortedTransactions)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const presetRanges = [
        { label: 'This Month', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
        { label: 'Last Month', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
        { label: 'Last 3 Months', start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) },
    ]

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                        <MdWallet className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Cash Flow</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your income and expenses</p>
                    </div>
                </div>
                <button 
                    onClick={fetchCashFlow}
                    className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                    <MdRefresh size={20} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-wrap gap-3">
                {presetRanges.map((range, idx) => (
                    <button
                        key={idx}
                        onClick={() => setDateRange({
                            start: format(range.start, 'yyyy-MM-dd'),
                            end: format(range.end, 'yyyy-MM-dd')
                        })}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            dateRange.start === format(range.start, 'yyyy-MM-dd')
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Income */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <MdTrendingUp className="text-green-600" size={24} />
                        </div>
                        <MdArrowUpward className="text-green-600" size={24} />
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Income</p>
                    <p className="text-2xl font-black text-green-600">₹{summary.income.toLocaleString('en-IN')}</p>
                </div>

                {/* Expense */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                            <MdTrendingDown className="text-red-600" size={24} />
                        </div>
                        <MdArrowDownward className="text-red-600" size={24} />
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Expense</p>
                    <p className="text-2xl font-black text-red-600">₹{summary.expense.toLocaleString('en-IN')}</p>
                </div>

                {/* Balance */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            summary.balance >= 0 
                                ? 'bg-blue-100 dark:bg-blue-900/30' 
                                : 'bg-orange-100 dark:bg-orange-900/30'
                        }`}>
                            <MdWallet className={summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'} size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Net Balance</p>
                    <p className={`text-2xl font-black ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ₹{summary.balance.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Daily Breakdown</h2>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <MdRefresh size={32} className="mx-auto text-slate-300 animate-spin" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-20 text-center">
                        <MdWallet size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No transactions</h3>
                        <p className="text-slate-500 mt-1">No transactions found for the selected period</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.map((t, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        t.balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                                    }`}>
                                        {t.balance >= 0 ? (
                                            <MdTrendingUp size={18} className="text-green-600" />
                                        ) : (
                                            <MdTrendingDown size={18} className="text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {format(new Date(t.date), 'dd MMM yyyy')}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Income: ₹{t.income.toLocaleString('en-IN')} • Expense: ₹{t.expense.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                                <p className={`font-black ${t.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.balance >= 0 ? '+' : ''}₹{t.balance.toLocaleString('en-IN')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
