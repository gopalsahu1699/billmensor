'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { MdArrowBack, MdDownload, MdRefresh } from 'react-icons/md'
import { generateTallyXml, downloadTallyXml, TallyVoucher, TallyLedger } from '@/lib/tally-export'

export default function TallyExportPage() {
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month')
    const [companyName, setCompanyName] = useState('My Company')
    const [stats, setStats] = useState({
        invoices: 0,
        purchases: 0,
        customers: 0,
        totalSales: 0,
        totalPurchases: 0
    })

    const getDateFilter = useCallback(() => {
        const now = new Date()
        switch (dateRange) {
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            case 'quarter':
                return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()
            case 'year':
                return new Date(now.getFullYear(), 0, 1).toISOString()
            case 'all':
                return new Date(2000, 0, 1).toISOString()
        }
    }, [dateRange])

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true)
            const startDate = getDateFilter()

            // Fetch profile
            const { data: profile } = await supabase.from('profiles').select('company_name').single()
            if (profile?.company_name) setCompanyName(profile.company_name)

            // Fetch invoices count
            const { data: invoices } = await supabase
                .from('invoices')
                .select('id, total_amount')
                .gte('invoice_date', startDate)

            // Fetch purchases count
            const { data: purchases } = await supabase
                .from('purchases')
                .select('id, total_amount')
                .gte('purchase_date', startDate)

            // Fetch customers
            const { data: customers } = await supabase
                .from('customers')
                .select('id')

            const totalSales = invoices?.reduce((s, i) => s + (Number(i.total_amount) || 0), 0) || 0
            const totalPurchases = purchases?.reduce((s, p) => s + (Number(p.total_amount) || 0), 0) || 0

            setStats({
                invoices: invoices?.length || 0,
                purchases: purchases?.length || 0,
                customers: customers?.length || 0,
                totalSales,
                totalPurchases
            })
        } catch {
            toast.error('Failed to fetch data preview')
        } finally {
            setLoading(false)
        }
    }, [getDateFilter])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const handleExport = async () => {
        try {
            setExporting(true)
            const startDate = getDateFilter()

            // Fetch invoices with customer details
            const { data: invoices, error: invErr } = await supabase
                .from('invoices')
                .select('*, customers(name, gstin, state)')
                .gte('invoice_date', startDate)
                .order('invoice_date', { ascending: true })

            if (invErr) throw invErr

            // Fetch purchases
            const { data: purchases, error: purErr } = await supabase
                .from('purchases')
                .select('*, customers(name, gstin, state)')
                .gte('purchase_date', startDate)
                .order('purchase_date', { ascending: true })

            if (purErr) throw purErr

            // Build unique ledgers
            const ledgerMap = new Map<string, TallyLedger>()

            // Add default ledgers
            ledgerMap.set('Sales Account', { name: 'Sales Account', parent: 'Sales Accounts' })
            ledgerMap.set('Purchase Account', { name: 'Purchase Account', parent: 'Purchase Accounts' })
            ledgerMap.set('CGST', { name: 'CGST', parent: 'Duties & Taxes' })
            ledgerMap.set('SGST', { name: 'SGST', parent: 'Duties & Taxes' })

            // Add party ledgers
            invoices?.forEach(inv => {
                const name = inv.customers?.name || 'Cash Sales'
                if (!ledgerMap.has(name)) {
                    ledgerMap.set(name, {
                        name,
                        parent: 'Sundry Debtors',
                        gstNumber: inv.customers?.gstin || undefined,
                        state: inv.customers?.state || undefined
                    })
                }
            })

            purchases?.forEach(pur => {
                const name = pur.customers?.name || 'Cash Purchase'
                if (!ledgerMap.has(name)) {
                    ledgerMap.set(name, {
                        name,
                        parent: 'Sundry Creditors',
                        gstNumber: pur.customers?.gstin || undefined,
                        state: pur.customers?.state || undefined
                    })
                }
            })

            // Build vouchers
            const vouchers: TallyVoucher[] = []

            invoices?.forEach(inv => {
                vouchers.push({
                    date: inv.invoice_date,
                    voucherNumber: inv.invoice_number || `INV-${inv.id?.slice(0, 8)}`,
                    partyName: inv.customers?.name || 'Cash Sales',
                    ledgerName: 'Sales Account',
                    amount: Number(inv.total_amount) || 0,
                    gstAmount: Number(inv.tax_amount) || 0,
                    gstRate: Number(inv.gst_rate) || 18,
                    narration: `Sales Invoice ${inv.invoice_number}`,
                    voucherType: 'Sales'
                })
            })

            purchases?.forEach(pur => {
                vouchers.push({
                    date: pur.purchase_date,
                    voucherNumber: pur.purchase_number || `PUR-${pur.id?.slice(0, 8)}`,
                    partyName: pur.customers?.name || 'Cash Purchase',
                    ledgerName: 'Purchase Account',
                    amount: Number(pur.total_amount) || 0,
                    gstAmount: Number(pur.tax_amount) || 0,
                    gstRate: Number(pur.gst_rate) || 18,
                    narration: `Purchase Bill ${pur.purchase_number}`,
                    voucherType: 'Purchase'
                })
            })

            if (vouchers.length === 0) {
                toast.error('No vouchers found for the selected period')
                setExporting(false)
                return
            }

            const ledgers = Array.from(ledgerMap.values())
            const xml = generateTallyXml(vouchers, ledgers, companyName)
            const periodLabel = dateRange === 'all' ? 'All' : dateRange.toUpperCase()
            downloadTallyXml(xml, `Billmensor_Tally_Export_${periodLabel}_${new Date().toISOString().slice(0, 10)}.xml`)

            toast.success(`Exported ${vouchers.length} vouchers and ${ledgers.length} ledgers to Tally XML!`)
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Export failed'
            toast.error(msg)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/reports" className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <MdArrowBack size={20} className="text-slate-600 dark:text-slate-400" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">Reports</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Tally Export</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Tally Export</h1>
                    </div>
                </div>
            </div>

            {/* Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-[32px] p-10 text-white shadow-2xl">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-300/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6">
                        <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
                        Tally Prime / ERP 9 Compatible
                    </div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tight leading-none mb-3">
                        One-Click<br />Tally Import
                    </h2>
                    <p className="text-orange-100 max-w-lg font-medium leading-relaxed">
                        Export all your Sales and Purchase vouchers along with Party Ledgers and GST breakdowns
                        in a Tally-compatible XML format. Your CA can import this directly into Tally Prime or ERP 9.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Export Period</label>
                    <div className="flex flex-wrap gap-3">
                        {(['month', 'quarter', 'year', 'all'] as const).map(period => (
                            <button
                                key={period}
                                onClick={() => setDateRange(period)}
                                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${dateRange === period
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {period === 'month' ? 'This Month' : period === 'quarter' ? 'Last 3 Months' : period === 'year' ? 'This Year' : 'All Time'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Vouchers</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white italic">{loading ? '...' : stats.invoices}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Vouchers</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white italic">{loading ? '...' : stats.purchases}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
                        <p className="text-2xl font-black text-green-600 italic">₹{loading ? '...' : stats.totalSales.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Purchases</p>
                        <p className="text-2xl font-black text-red-500 italic">₹{loading ? '...' : stats.totalPurchases.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Export Button */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={handleExport}
                        disabled={exporting || loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                    >
                        {exporting ? <MdRefresh size={20} className="animate-spin" /> : <MdDownload size={20} />}
                        {exporting ? 'Generating XML...' : 'Export to Tally XML'}
                    </button>
                    <button
                        onClick={fetchStats}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl h-14 px-8 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <MdRefresh size={18} /> Refresh Preview
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic mb-6">How to Import in Tally</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 font-black text-xl">1</div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Download XML</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Click &quot;Export to Tally XML&quot; above. The file will be saved to your Downloads folder.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 font-black text-xl">2</div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Open Tally Prime</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Go to <strong>Gateway of Tally → Import Data</strong> (or press Alt+H → Import in ERP 9).</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 font-black text-xl">3</div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Select &amp; Import</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Browse to the downloaded XML file and click Import. All vouchers and ledgers will appear automatically!</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
