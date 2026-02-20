'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const reportGroups = [
    {
        title: 'GST & Compliance',
        description: 'Government filing and tax reports',
        icon: 'description',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        borderColor: 'group-hover:border-blue-200',
        reports: [
            { name: 'Consolidated Audit Report', desc: 'One-page summary for your CA audit', href: '/dashboard/reports/ca-audit', icon: 'analytics' },
            { name: 'GSTR-1 Filing Center', desc: 'JSON Filing & XLS Summary exports', href: '/dashboard/reports/gstr1-json', icon: 'account_balance' },
            { name: 'GSTR-3B Summary', desc: 'Monthly tax summary for return filing', href: '/dashboard/reports/gstr3b', icon: 'description' },
        ]
    },
    {
        title: 'Financial Analysis',
        description: 'Profitability and business health',
        icon: 'trending_up',
        color: 'text-green-600',
        bg: 'bg-green-50',
        borderColor: 'group-hover:border-green-200',
        reports: [
            { name: 'Profit & Loss (Invoice Wise)', desc: 'Profit margin per transaction', href: '/dashboard/reports/pl-invoice', icon: 'monitoring' },
            { name: 'Sales Performance', desc: 'Top selling products and categories', href: '/dashboard/reports/sales-performance', icon: 'trending_up' },
            { name: 'Profit & Loss (Stock Wise)', desc: 'Inventory valuation based profit', href: '/dashboard/reports/pl-stock', icon: 'pie_chart' },
        ]
    },
    {
        title: 'Operations',
        description: 'Inventory and ledger summaries',
        icon: 'inventory_2',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        borderColor: 'group-hover:border-purple-200',
        reports: [
            { name: 'Party Ledger Account', desc: 'Consolidated customer/supplier statements', href: '/dashboard/reports/party-ledgers', icon: 'group' },
            { name: 'Expense Breakdown', desc: 'Daily expense analysis by category', href: '/dashboard/reports/expenses', icon: 'account_balance_wallet' },
            { name: 'Stock Summary', desc: 'Current inventory value and status', href: '/dashboard/reports/stock-summary', icon: 'inventory_2' },
        ]
    }
]

export default function ReportsDashboard() {
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({
        sales: 0,
        expenses: 0,
        profit: 0,
        count: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            // Fetch total sales
            const { data: invoices } = await supabase.from('invoices').select('total_amount')
            const totalSales = invoices?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0

            // Fetch total expenses
            const { data: expenses } = await supabase.from('expenses').select('amount')
            const totalExpenses = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0

            setStats({
                sales: totalSales,
                expenses: totalExpenses,
                profit: totalSales - totalExpenses,
                count: (invoices?.length || 0)
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredGroups = reportGroups.map(group => ({
        ...group,
        reports: group.reports.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.reports.length > 0)

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Enterprise Header Section */}
            <div className="relative overflow-hidden bg-slate-900 dark:bg-primary/5 rounded-[40px] p-10 md:p-16 text-white shadow-2xl border border-slate-800">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
                            INTELLIGENCE HUB
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight italic uppercase leading-none">
                            Revenue <br /><span className="text-primary">Analytics</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
                            Holistic financial visualization and compliance-ready government filing exports at your fingertips.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-[32px] ring-1 ring-white/10">
                        <div className="space-y-2">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gross Sales</p>
                            <p className="text-3xl font-black text-white italic">₹{stats.sales.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-full h-px lg:w-px lg:h-12 bg-white/10"></div>
                        <div className="space-y-2">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Net Margin</p>
                            <p className="text-3xl font-black text-green-400 italic">₹{stats.profit.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center rounded-[40px]">
                        <span className="material-symbols-outlined animate-spin text-primary text-[48px]">sync</span>
                    </div>
                )}
            </div>

            {/* Smart Search Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
                <div className="relative flex-1 max-w-2xl group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[24px]">search_insights</span>
                    <input
                        type="text"
                        placeholder="Analyze files (e.g. GSTR-1, P&L, Party Ledgers)..."
                        className="w-full h-16 pl-14 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    Refreshed: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
            </div>

            {/* Matrix of Report Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-6">
                {filteredGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-8">
                        <div className="flex items-center gap-4 px-2">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", group.bg, group.color)}>
                                <span className="material-symbols-outlined text-[20px]">{group.icon}</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter italic">{group.title}</h2>
                        </div>

                        <div className="space-y-5">
                            {group.reports.map((report, reportIndex) => (
                                <Link
                                    key={reportIndex}
                                    href={report.href}
                                    className="group block relative bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1.5"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:rotate-12 group-hover:scale-110">
                                            <span className="material-symbols-outlined text-[28px]">
                                                {report.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 pr-8">
                                            <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-sm group-hover:text-primary transition-colors">{report.name}</h3>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-bold uppercase tracking-tighter opacity-70">{report.desc}</p>
                                        </div>
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/10 transition-all duration-300">
                                                <span className="material-symbols-outlined text-primary text-[20px]">arrow_forward</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty Discovery State */}
            {filteredGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-[48px]">search_off</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 italic uppercase">No Analytical Matches</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Try broader keywords like "Revenue" or "Stock".</p>
                    </div>
                    <button onClick={() => setSearchQuery('')} className="px-8 py-3 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all">Clear Search Filters</button>
                </div>
            )}
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
