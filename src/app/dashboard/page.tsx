'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Loader2, Banknote, Send, CreditCard, Wallet, ArrowRight, TrendingUp, TrendingDown, MoreVertical, PlusCircle, UserPlus, Receipt, BarChart3, FileText, LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
    const [stats, setStats] = useState([
        { label: 'Total Customers', value: '0' },
        { label: 'Total Invoices', value: '0' },
        { label: 'Total Sales', value: '₹ 0' },
        { label: 'Total Expenses', value: '₹ 0' },
    ])
    const [recentInvoices, setRecentInvoices] = useState<any[]>([])
    const [recentPayments, setRecentPayments] = useState<any[]>([])
    const [totalSales, setTotalSales] = useState(0)
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [chartData, setChartData] = useState<number[]>([180, 160, 80, 100, 40, 60]) // Scaled points
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    async function fetchDashboardStats() {
        try {
            const [custCount, invCount, expRes, invData, payData] = await Promise.all([
                supabase.from('customers').select('*', { count: 'exact', head: true }),
                supabase.from('invoices').select('*', { count: 'exact', head: true }),
                supabase.from('expenses').select('amount'),
                supabase.from('invoices').select('*, customers(name)').order('created_at', { ascending: false }).limit(5),
                supabase.from('payments').select('*, customers(name)').eq('type', 'payment_in').order('payment_date', { ascending: false }).limit(5)
            ])

            const totalSalesRes = await supabase.from('invoices').select('total_amount, created_at')
            const computedSales = totalSalesRes.data?.reduce((acc: any, curr: any) => acc + curr.total_amount, 0) || 0
            const computedExpenses = expRes.data?.reduce((acc: any, curr: any) => acc + curr.amount, 0) || 0

            setTotalSales(computedSales)
            setTotalExpenses(computedExpenses)

            // Dynamic Chart Data Grouping (Last 30 Days)
            if (totalSalesRes.data) {
                const now = new Date()
                const buckets = [0, 0, 0, 0, 0, 0]
                const bucketDays = 5

                totalSalesRes.data.forEach((inv: any) => {
                    const invDate = new Date(inv.created_at)
                    const diffTime = Math.abs(now.getTime() - invDate.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays <= 30) {
                        const bucketIndex = Math.min(Math.floor((diffDays - 1) / bucketDays), 5)
                        buckets[5 - bucketIndex] += inv.total_amount
                    }
                })

                // Scale buckets for SVG height (240px)
                const maxVal = Math.max(...buckets, 1000)
                const scaled = buckets.map(v => 240 - ((v / maxVal) * 160 + 20)) // Keep some padding
                setChartData(scaled)
            }

            setStats([
                { label: 'Total Sales', value: `₹ ${(computedSales || 0).toLocaleString('en-IN')}` },
                { label: 'Total Expenses', value: `₹ ${(computedExpenses || 0).toLocaleString('en-IN')}` },
                { label: 'Total Invoices', value: String(invCount.count || 0) },
                { label: 'Total Customers', value: String(custCount.count || 0) },
            ])

            setRecentInvoices(invData.data || [])
            setRecentPayments(payData.data || [])
        } catch (error) {
            console.error('Stats error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="text-primary" size={24} />
                        Financial Dashboard
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor your company&apos;s billing performance and incoming revenue.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            import('sonner').then(({ toast }) => toast.info('Data export engine initializing... XLS/PDF generation will be available shortly.'))
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">file_download</span>
                        Export Data
                    </button>
                    <Link href="/dashboard/customers">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            Add Client
                        </button>
                    </Link>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                    label="Total Revenue"
                    value={`₹ ${(totalSales || 0).toLocaleString('en-IN')}`}
                    icon="payments"
                    trend="+12.5%"
                    trendColor="text-green-500"
                    iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                    loading={loading}
                />
                <MetricCard
                    label="Total Expenses"
                    value={`₹ ${(totalExpenses || 0).toLocaleString('en-IN')}`}
                    icon="receipt_long"
                    trend="Stable"
                    trendColor="text-slate-400"
                    iconBg="bg-red-50 dark:bg-red-900/30 text-red-600"
                    loading={loading}
                />
                <MetricCard
                    label="Paid Invoices"
                    value={stats.find(s => s.label === 'Total Invoices')?.value || '0'}
                    icon="task_alt"
                    trend="+8.2%"
                    trendColor="text-green-500"
                    iconBg="bg-green-50 dark:bg-green-900/30 text-green-600"
                    loading={loading}
                />
                <MetricCard
                    label="Total Customers"
                    value={stats.find(s => s.label === 'Total Customers')?.value || '0'}
                    icon="group"
                    trend="+5.1%"
                    trendColor="text-blue-500"
                    iconBg="bg-slate-50 dark:bg-slate-800 text-slate-600"
                    loading={loading}
                />
            </div>

            {/* Charts & Secondary Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Revenue Overview Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Revenue Overview</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Sales vs Expenses performance</p>
                        </div>
                        <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer w-full sm:w-auto">
                            <option>Current Month</option>
                            <option>Last 6 Months</option>
                        </select>
                    </div>

                    <div className="relative h-[200px] sm:h-[240px] w-full mt-4 group">
                        <svg className="w-full h-full drop-shadow-lg" preserveAspectRatio="none" viewBox="0 0 800 240">
                            <defs>
                                <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                    <stop offset="0%" stopColor="#1152d4" stopOpacity="0.3"></stop>
                                    <stop offset="100%" stopColor="#1152d4" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path
                                d={`M0,${chartData[0]} ${chartData.map((y, i) => `L${(i * 800) / (chartData.length - 1)},${y}`).join(' ')} V240 H0 Z`}
                                fill="url(#gradient)"
                                className="transition-all duration-1000 ease-out"
                            ></path>
                            <path
                                d={`M0,${chartData[0]} ${chartData.map((y, i) => `L${(i * 800) / (chartData.length - 1)},${y}`).join(' ')}`}
                                fill="none"
                                stroke="#1152d4"
                                strokeLinecap="round"
                                strokeWidth="4"
                                className="transition-all duration-1000 ease-out"
                            ></path>
                            {chartData.map((y, i) => (
                                <circle
                                    key={i}
                                    cx={(i * 800) / (chartData.length - 1)}
                                    cy={y}
                                    fill="#1152d4"
                                    r="5"
                                    className="hover:r-7 transition-all cursor-pointer box-content border-4 border-white dark:border-slate-900 shadow-sm"
                                />
                            ))}
                        </svg>
                        <div className="flex justify-between mt-6 px-2 overflow-hidden">
                            {['Day 1-5', '6-10', '11-15', '16-20', '21-25', '26-30'].map((w) => (
                                <span key={w} className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{w}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Stats */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 tracking-tight">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <QuickAction icon={<PlusCircle size={20} />} label="Invoice" href="/dashboard/invoices/create" />
                            <QuickAction icon={<UserPlus size={20} />} label="Client" href="/dashboard/customers" />
                            <QuickAction icon={<Receipt size={20} />} label="Expenses" href="/dashboard/expenses" />
                            <QuickAction icon={<BarChart3 size={20} />} label="Reports" href="/dashboard/reports" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-primary to-blue-700 p-6 sm:p-8 rounded-2xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-lg font-bold mb-1 relative z-10">Business Insights</h3>
                        <p className="text-blue-100 text-sm mb-6 relative z-10 leading-relaxed">Upgrade to unlock advanced tax reports and inventory forecasting.</p>
                        <Link href="/dashboard/reports">
                            <button className="w-full bg-white text-primary py-3 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all relative z-10 shadow-sm active:scale-95">
                                Learn More
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase italic">Recent Invoices</h3>
                    </div>
                    <Link href="/dashboard/invoices">
                        <button className="text-primary text-sm font-bold hover:underline transition-all underline-offset-4 flex items-center gap-1 group">
                            View All Invoices
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-slate-900">
                                                {inv.customers?.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{inv.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">{inv.invoice_number}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-slate-100">₹ {(inv.total_amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                            inv.payment_status === 'paid'
                                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                        )}>
                                            {inv.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link href={`/dashboard/invoices/${inv.id}`}>
                                            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <MoreVertical size={20} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {recentInvoices.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic text-sm">No recent transactions discovered.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Payments Received Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-l-4 border-l-green-500">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                            <Banknote size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase italic text-green-600">Recent Payments Received</h3>
                    </div>
                    <Link href="/dashboard/payments-in">
                        <button className="text-primary text-sm font-bold hover:underline transition-all underline-offset-4 flex items-center gap-1 group">
                            View All Payments
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Receipt ID</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentPayments.map((pay) => (
                                <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-slate-900">
                                                {pay.customers?.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{pay.customers?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">{pay.payment_number}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(pay.payment_date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 text-sm font-black text-green-600 dark:text-green-400">₹ {(pay.amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {pay.payment_mode || 'Cash'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link href={`/dashboard/payments-in/${pay.id}`}>
                                            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <MoreVertical size={20} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {recentPayments.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic text-sm">No recent payments discovered.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, icon, trend, trendColor, iconBg, loading }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-primary/20 group">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-2.5 rounded-xl transition-transform group-hover:rotate-6", iconBg)}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                <span className={cn("text-[11px] font-black flex items-center gap-1 uppercase tracking-tighter", trendColor)}>
                    {trend}
                    <span className="material-symbols-outlined text-[14px]">
                        {trend.includes('+') ? 'trending_up' : trend.includes('-') ? 'trending_down' : 'horizontal_rule'}
                    </span>
                </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                {loading ? <span className="animate-pulse">...</span> : value}
            </h3>
        </div>
    )
}

function QuickAction({ icon, label, href }: any) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-95">
            <div className="text-primary mb-3 group-hover:scale-110 group-hover:-rotate-6 transition-transform">{icon}</div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{label}</span>
        </Link>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
